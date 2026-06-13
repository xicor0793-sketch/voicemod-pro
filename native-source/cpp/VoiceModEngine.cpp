#include "VoiceModEngine.h"
#include <cstring>
#include <algorithm>

namespace voicemod {

VoiceModEngine::VoiceModEngine() {
    limiter_.setThreshold(-1.0f);
    limiter_.setRatio(4.0f);
    limiter_.setAttack(0.5f, sampleRate_);
    limiter_.setRelease(20.0f, sampleRate_);
}

bool VoiceModEngine::init(float sampleRate, size_t bufferSize) {
    if (initialized_.load()) destroy();

    sampleRate_ = sampleRate;
    bufferSize_ = bufferSize;

    allocateScratch(bufferSize_ * 2);

    pitchShifter_.setSampleRate(sampleRate_);
    eqBank_.setSampleRate(sampleRate_);
    spatializer_.setSampleRate(sampleRate_);
    panSystem_.setSampleRate(sampleRate_);
    reverb_.setSampleRate(sampleRate_);

    reset();

    initialized_.store(true);
    return true;
}

void VoiceModEngine::destroy() {
    initialized_.store(false);
    deallocateScratch();
}

void VoiceModEngine::reset() {
    std::lock_guard<std::mutex> lock(paramMutex_);
    pitchShifter_.reset();
    eqBank_.reset();
    spatializer_.reset();
    panSystem_.reset();
    reverb_.reset();
    limiter_.reset();
    peakLevel_ = 0.0f;
    gainReduction_ = 1.0f;
}

void VoiceModEngine::updateParams(const VoiceModParams& params) {
    pendingParams_ = params;
    std::lock_guard<std::mutex> lock(paramMutex_);
    currentParams_ = params;
    enabled_.store(params.enabled);
    applyParams(params);
}

void VoiceModEngine::process(float* input, float* output, size_t numSamples) {
    if (!initialized_.load() || !enabled_.load()) {
        if (output != input) {
            std::copy(input, input + numSamples, output);
        }
        return;
    }

    std::lock_guard<std::mutex> lock(paramMutex_);

    // Ensure scratch buffers are large enough
    if (numSamples > scratchSize_) {
        allocateScratch(numSamples * 2);
    }

    // --- DSP Effects Rack (sequential order) ---

    // 1. Voice Boost (Gain Layer) + Soft Clipping
    applyGain(input, monoScratch_, numSamples);

    // 2. Pitch Shifter
    pitchShifter_.processBlock(monoScratch_, monoScratch_, numSamples);

    // 3. Parametric EQ (Biquad Filter Bank)
    eqBank_.processBlock(monoScratch_, monoScratch_, numSamples);

    // 4. Reverb (before spatial to feed wet signal into spatial)
    reverb_.processBlock(monoScratch_, monoScratch_, numSamples);

    // 5. Stereo Spatializer (mono -> pseudo-stereo via Haas)
    spatializer_.processMonoToStereo(monoScratch_, stereoScratchL_, stereoScratchR_, numSamples);

    // 6. Stereo Panning System (constant-power + LFO)
    panSystem_.process(stereoScratchL_, stereoScratchR_,
                       stereoScratchL_, stereoScratchR_, numSamples);

    // Interleave stereo output
    for (size_t i = 0; i < numSamples; ++i) {
        output[i * 2]     = stereoScratchL_[i];
        output[i * 2 + 1] = stereoScratchR_[i];
    }

    // Peak metering
    for (size_t i = 0; i < numSamples * 2; ++i) {
        float absVal = std::abs(output[i]);
        if (absVal > peakLevel_) peakLevel_ = absVal;
    }
    peakLevel_ *= 0.999f;
}

void VoiceModEngine::processInterleaved(float* input, float* output, size_t numFrames) {
    if (!initialized_.load() || !enabled_.load()) {
        if (output != input) {
            std::copy(input, input + numFrames * 2, output);
        }
        return;
    }

    std::lock_guard<std::mutex> lock(paramMutex_);

    size_t numSamples = numFrames;

    if (numSamples > scratchSize_) {
        allocateScratch(numSamples * 2);
    }

    // De-interleave
    for (size_t i = 0; i < numSamples; ++i) {
        monoScratch_[i] = (input[i * 2] + input[i * 2 + 1]) * 0.5f;
    }

    // DSP Chain
    applyGain(monoScratch_, monoScratch_, numSamples);
    pitchShifter_.processBlock(monoScratch_, monoScratch_, numSamples);
    eqBank_.processBlock(monoScratch_, monoScratch_, numSamples);
    reverb_.processBlock(monoScratch_, monoScratch_, numSamples);
    spatializer_.processMonoToStereo(monoScratch_, stereoScratchL_, stereoScratchR_, numSamples);
    panSystem_.process(stereoScratchL_, stereoScratchR_,
                       stereoScratchL_, stereoScratchR_, numSamples);

    // Re-interleave
    for (size_t i = 0; i < numSamples; ++i) {
        output[i * 2]     = stereoScratchL_[i];
        output[i * 2 + 1] = stereoScratchR_[i];
    }

    for (size_t i = 0; i < numSamples * 2; ++i) {
        float absVal = std::abs(output[i]);
        if (absVal > peakLevel_) peakLevel_ = absVal;
    }
    peakLevel_ *= 0.999f;
}

float VoiceModEngine::getLatencyMs() const {
    // Buffer-based latency
    return static_cast<float>(bufferSize_) / sampleRate_ * 1000.0f;
}

float VoiceModEngine::getPeakLevel() const {
    return peakLevel_;
}

float VoiceModEngine::getGainReduction() const {
    return gainReduction_;
}

void VoiceModEngine::allocateScratch(size_t size) {
    deallocateScratch();
    scratchSize_ = size;
    monoScratch_ = new float[size]();
    stereoScratchL_ = new float[size]();
    stereoScratchR_ = new float[size]();
}

void VoiceModEngine::deallocateScratch() {
    delete[] monoScratch_;
    delete[] stereoScratchL_;
    delete[] stereoScratchR_;
    monoScratch_ = nullptr;
    stereoScratchL_ = nullptr;
    stereoScratchR_ = nullptr;
    scratchSize_ = 0;
}

void VoiceModEngine::applyParams(const VoiceModParams& params) {
    gainLinear_ = dbToGain(params.gainDb);
    pitchShifter_.setPitchShift(params.pitchShiftSemitones);
    eqBank_.setLowShelf(params.lowShelfDb);
    eqBank_.setHighShelf(params.highShelfDb);
    eqBank_.setMidShelf(params.midShelfDb);
    eqBank_.setTreble(params.trebleDb);
    spatializer_.setWidth(params.spatialWidth);
    panSystem_.setPan(params.pan);
    panSystem_.setAutoPanSpeed(params.autoPanSpeed);
    panSystem_.setAutoPanDepth((params.autoPanSpeed > 0.01f) ? 1.0f : 0.0f);
    reverb_.setRoomSize(params.reverbSize);
    reverb_.setWetMix(params.reverbMix);
    reverb_.setDryMix(1.0f - params.reverbMix);
}

void VoiceModEngine::applyGain(const float* input, float* output, size_t numSamples) {
    for (size_t i = 0; i < numSamples; ++i) {
        float sample = input[i] * gainLinear_;
        sample = softClipTanh(sample);
        sample = limiter_.process(sample);
        sample = clipGuard_.process(sample);
        output[i] = sample;
    }
    gainReduction_ = limiter_.getGainReduction();
}

} // namespace voicemod
