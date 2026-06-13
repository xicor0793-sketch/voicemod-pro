#include "Spatializer.h"
#include <cstring>
#include <algorithm>

namespace voicemod {

Spatializer::Spatializer() {
    updateDelaySize();
}

void Spatializer::setSampleRate(float sampleRate) {
    sampleRate_ = sampleRate;
    updateDelaySize();
}

void Spatializer::setWidth(float percent) {
    width_ = clamp(percent / 100.0f, 0.0f, 1.0f);
}

void Spatializer::setDelay(float delayMs) {
    haasDelayMs_ = clamp(delayMs, 0.0f, 40.0f);
    updateDelaySize();
}

void Spatializer::reset() {
    std::fill(delayBufferL_.begin(), delayBufferL_.end(), 0.0f);
    std::fill(delayBufferR_.begin(), delayBufferR_.end(), 0.0f);
    writePos_ = 0;
}

void Spatializer::processMonoToStereo(const float* mono, float* left, float* right, size_t numSamples) {
    if (width_ < 0.01f) {
        std::copy(mono, mono + numSamples, left);
        std::copy(mono, mono + numSamples, right);
        return;
    }

    for (size_t i = 0; i < numSamples; ++i) {
        float m = mono[i];

        // L channel: direct signal
        float lDirect = m;

        // R channel: delayed signal (Haas)
        size_t readPos = (writePos_ + 1) % delayBufferR_.size();
        float rDelayed = delayBufferR_[readPos];
        delayBufferR_[writePos_] = m;

        // Cross-feed for width enhancement
        float mid = (lDirect + rDelayed) * 0.5f;
        float side = (lDirect - rDelayed) * 0.5f;

        // Widen: boost side component
        float widenedL = mid + side * (1.0f + width_);
        float widenedR = mid - side * (1.0f + width_);

        // Soft saturate to prevent artifacts
        left[i] = softClipArctan(widenedL, 1.2f);
        right[i] = softClipArctan(widenedR, 1.2f);

        writePos_ = (writePos_ + 1) % delayBufferR_.size();
    }
}

void Spatializer::updateDelaySize() {
    haasDelaySamples_ = static_cast<size_t>(haasDelayMs_ * 0.001f * sampleRate_);
    if (haasDelaySamples_ < 2) haasDelaySamples_ = 2;
    delayBufferR_.resize(haasDelaySamples_, 0.0f);
}

} // namespace voicemod
