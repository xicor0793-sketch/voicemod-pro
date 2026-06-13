#include "PitchShifter.h"
#include <cstring>
#include <algorithm>

namespace voicemod {

PitchShifter::PitchShifter() {
    windowLen_ = static_cast<size_t>(windowSize_ * 0.001f * sampleRate_);
    windowLen_ = nextPowerOf2(windowLen_);
    analysisHop_ = windowLen_ / 4;
    synthesisHop_ = analysisHop_;
    inputBufferSize_ = windowLen_ * 4;

    inputBuffer_.resize(inputBufferSize_, 0.0f);
    outputBuffer_.resize(inputBufferSize_, 0.0f);
    window_.resize(windowLen_, 0.0f);

    for (size_t i = 0; i < windowLen_; ++i) {
        float t = static_cast<float>(i) / static_cast<float>(windowLen_);
        window_[i] = 0.5f * (1.0f - std::cos(TWO_PI * t));
    }
}

void PitchShifter::setSampleRate(float sampleRate) {
    sampleRate_ = sampleRate;
    updateParameters();
}

void PitchShifter::setPitchShift(float semitones) {
    semitones = clamp(semitones, -12.0f, 12.0f);
    pitchRatio_ = std::pow(2.0f, semitones / 12.0f);
    updateParameters();
}

void PitchShifter::setWindowSize(float ms) {
    windowSize_ = clamp(ms, 10.0f, 100.0f);
    updateParameters();
}

void PitchShifter::reset() {
    std::fill(inputBuffer_.begin(), inputBuffer_.end(), 0.0f);
    std::fill(outputBuffer_.begin(), outputBuffer_.end(), 0.0f);
    writePos_ = 0;
    readPos_ = 0;
    deltaWritePos_ = 0.0f;
    deltaReadPos_ = 0.0f;
}

float PitchShifter::process(float input) {
    inputBuffer_[writePos_] = input;

    float output = 0.0f;
    float norm = 0.0f;

    if (std::abs(pitchRatio_ - 1.0f) < 0.001f) {
        output = input;
    } else {
        size_t localReadPos = readPos_;
        for (size_t i = 0; i < windowLen_; ++i) {
            size_t idx = (localReadPos + i) % inputBufferSize_;
            if (idx < outputBuffer_.size()) {
                float w = window_[i];
                output += outputBuffer_[idx] * w;
                norm += w;
            }
        }
        if (norm > 1e-10f) output /= norm;
    }

    deltaWritePos_ += pitchRatio_;
    deltaReadPos_ += 1.0f;

    while (deltaWritePos_ >= 1.0f) {
        deltaWritePos_ -= 1.0f;
        writePos_ = (writePos_ + 1) % inputBufferSize_;
    }
    while (deltaReadPos_ >= 1.0f) {
        deltaReadPos_ -= 1.0f;
        readPos_ = (readPos_ + 1) % inputBufferSize_;
    }

    size_t localReadPos2 = readPos_;
    for (size_t i = 0; i < windowLen_; ++i) {
        size_t idx = (localReadPos2 + i) % inputBufferSize_;
        if (idx < outputBuffer_.size()) {
            outputBuffer_[idx] -= window_[i] * input;
        }
    }

    return output;
}

void PitchShifter::processBlock(const float* input, float* output, size_t numSamples) {
    for (size_t i = 0; i < numSamples; ++i) {
        output[i] = process(input[i]);
    }
}

void PitchShifter::updateParameters() {
    windowLen_ = static_cast<size_t>(windowSize_ * 0.001f * sampleRate_);
    windowLen_ = std::max(nextPowerOf2(windowLen_), static_cast<uint32_t>(64));
    analysisHop_ = windowLen_ / 4;
    synthesisHop_ = static_cast<size_t>(static_cast<float>(analysisHop_) / pitchRatio_);

    inputBufferSize_ = windowLen_ * 4;
    inputBuffer_.resize(inputBufferSize_, 0.0f);
    outputBuffer_.resize(inputBufferSize_, 0.0f);
    window_.resize(windowLen_);

    for (size_t i = 0; i < windowLen_; ++i) {
        float t = static_cast<float>(i) / static_cast<float>(windowLen_);
        window_[i] = 0.5f * (1.0f - std::cos(TWO_PI * t));
    }

    writePos_ = 0;
    readPos_ = 0;
    deltaWritePos_ = 0.0f;
    deltaReadPos_ = 0.0f;
}

void PitchShifter::applyWindow(float* block, size_t len) {
    for (size_t i = 0; i < len; ++i) {
        block[i] *= window_[i];
    }
}

float PitchShifter::findBestOverlap(const float* search, const float* target,
                                    size_t len, size_t maxShift) {
    float bestCorr = -1e10f;
    size_t bestOffset = 0;

    for (size_t offset = 0; offset <= maxShift * 2; ++offset) {
        float corr = 0.0f;
        size_t actualOffset = offset > maxShift ? offset - maxShift : 0;
        for (size_t i = 0; i < len; ++i) {
            size_t searchIdx = maxShift + i - actualOffset;
            if (searchIdx < len) {
                corr += search[searchIdx] * target[i];
            }
        }
        if (corr > bestCorr) {
            bestCorr = corr;
            bestOffset = offset > maxShift ? actualOffset : 0;
        }
    }

    return static_cast<float>(bestOffset);
}

} // namespace voicemod
