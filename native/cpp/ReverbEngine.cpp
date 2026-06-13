#include "ReverbEngine.h"
#include <cstring>
#include <algorithm>

namespace voicemod {

// -- CombFilter --

CombFilter::CombFilter() = default;

void CombFilter::setDelay(float ms, float sampleRate) {
    bufferSize_ = static_cast<size_t>(ms * 0.001f * sampleRate);
    if (bufferSize_ < 16) bufferSize_ = 16;
    buffer_.resize(bufferSize_, 0.0f);
    writePos_ = 0;
}

void CombFilter::setDecay(float decay) {
    decay_ = clamp(decay, 0.0f, 1.0f);
}

void CombFilter::setDampening(float damp) {
    dampening_ = clamp(damp, 0.0f, 1.0f);
}

void CombFilter::reset() {
    std::fill(buffer_.begin(), buffer_.end(), 0.0f);
    writePos_ = 0;
    lastOutput_ = 0.0f;
}

float CombFilter::process(float input) {
    size_t readPos = (writePos_ + 1) % bufferSize_;
    float readValue = buffer_[readPos];
    float filtered = lastOutput_ * (1.0f - dampening_) + readValue * dampening_;
    lastOutput_ = filtered;

    float output = readValue;
    buffer_[writePos_] = input + filtered * decay_;

    writePos_ = (writePos_ + 1) % bufferSize_;
    return output;
}

// -- AllPassFilter --

AllPassFilter::AllPassFilter() = default;

void AllPassFilter::setDelay(float ms, float sampleRate) {
    bufferSize_ = static_cast<size_t>(ms * 0.001f * sampleRate);
    if (bufferSize_ < 8) bufferSize_ = 8;
    buffer_.resize(bufferSize_, 0.0f);
    writePos_ = 0;
}

void AllPassFilter::setGain(float gain) {
    gain_ = gain;
}

void AllPassFilter::reset() {
    std::fill(buffer_.begin(), buffer_.end(), 0.0f);
    writePos_ = 0;
}

float AllPassFilter::process(float input) {
    size_t readPos = (writePos_ + 1) % bufferSize_;
    float readValue = buffer_[readPos];
    float output = -input + readValue;
    buffer_[writePos_] = input + readValue * gain_;
    writePos_ = (writePos_ + 1) % bufferSize_;
    return output;
}

// -- ReverbEngine --

ReverbEngine::ReverbEngine() {
    updateCombParams();
    updateAllPassParams();
}

void ReverbEngine::setSampleRate(float sampleRate) {
    sampleRate_ = sampleRate;
    updateCombParams();
    updateAllPassParams();
}

void ReverbEngine::setRoomSize(float size) {
    roomSize_ = clamp(size, 0.0f, 1.0f);
    updateCombParams();
}

void ReverbEngine::setDampening(float damp) {
    dampening_ = clamp(damp, 0.0f, 1.0f);
    updateCombParams();
}

void ReverbEngine::setWetMix(float wet) {
    wetMix_ = clamp(wet, 0.0f, 1.0f);
}

void ReverbEngine::setDryMix(float dry) {
    dryMix_ = clamp(dry, 0.0f, 1.0f);
}

void ReverbEngine::setWidth(float width) {
    width_ = clamp(width, 0.0f, 1.0f);
}

void ReverbEngine::reset() {
    for (auto& c : combs_) c.reset();
    for (auto& ap : allPasses_) ap.reset();
}

float ReverbEngine::process(float input) {
    float wet = 0.0f;
    for (size_t i = 0; i < kNumCombs; ++i) {
        wet += combs_[i].process(input);
    }
    wet *= 1.0f / static_cast<float>(kNumCombs);
    for (size_t i = 0; i < kNumAllPasses; ++i) {
        wet = allPasses_[i].process(wet);
    }
    return input * dryMix_ + wet * wetMix_;
}

void ReverbEngine::processBlock(const float* input, float* output, size_t numSamples) {
    for (size_t i = 0; i < numSamples; ++i) {
        output[i] = process(input[i]);
    }
}

void ReverbEngine::updateCombParams() {
    float scaledRoom = 0.5f + roomSize_ * 0.5f;
    for (size_t i = 0; i < kNumCombs; ++i) {
        combs_[i].setDelay(kCombDelaysMs[i], sampleRate_);
        combs_[i].setDecay(scaledRoom * 0.95f);
        combs_[i].setDampening(dampening_);
    }
}

void ReverbEngine::updateAllPassParams() {
    float allPassGain = 0.3f + roomSize_ * 0.2f;
    for (size_t i = 0; i < kNumAllPasses; ++i) {
        allPasses_[i].setDelay(kAllPassDelaysMs[i], sampleRate_);
        allPasses_[i].setGain(allPassGain);
    }
}

float ReverbEngine::monoToStereo(float mono, float* leftOut, float* rightOut) {
    float wet = mono;
    float scaledWidth = width_ * 0.5f;
    *leftOut = mono * (1.0f - scaledWidth) + wet * scaledWidth;
    *rightOut = mono * (1.0f - scaledWidth) - wet * scaledWidth;
    return (*leftOut + *rightOut) * 0.5f;
}

} // namespace voicemod
