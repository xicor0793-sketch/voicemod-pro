#include "Limiter.h"

namespace voicemod {

SoftLimiter::SoftLimiter(float thresholdDb, float kneeDb) {
    setThreshold(thresholdDb);
    setKnee(kneeDb);
}

void SoftLimiter::setThreshold(float thresholdDb) {
    threshold_ = dbToGain(thresholdDb);
}

void SoftLimiter::setKnee(float kneeDb) {
    knee_ = dbToGain(kneeDb);
}

void SoftLimiter::setRatio(float ratio) {
    ratio_ = ratio;
}

void SoftLimiter::setAttack(float attackMs, float sampleRate) {
    if (attackMs < 0.01f) attackMs = 0.01f;
    attackCoeff_ = std::exp(-1.0f / (attackMs * 0.001f * sampleRate));
}

void SoftLimiter::setRelease(float releaseMs, float sampleRate) {
    if (releaseMs < 1.0f) releaseMs = 1.0f;
    releaseCoeff_ = std::exp(-1.0f / (releaseMs * 0.001f * sampleRate));
}

void SoftLimiter::reset() {
    envelope_ = 0.0f;
    gainReduction_ = 0.0f;
}

float SoftLimiter::process(float input) {
    float absInput = std::abs(input);
    float envCoeff = (absInput > envelope_) ? attackCoeff_ : releaseCoeff_;
    envelope_ = envCoeff * envelope_ + (1.0f - envCoeff) * absInput;

    float gain = 1.0f;
    if (envelope_ > threshold_) {
        float overDb = gainToDb(envelope_ / threshold_);
        float reducedDb = overDb / ratio_;
        gain = dbToGain(-(overDb - reducedDb));
    }

    gainReduction_ = gain;

    return input * gain;
}

void SoftLimiter::processBlock(const float* input, float* output, size_t numSamples) {
    for (size_t i = 0; i < numSamples; ++i) {
        output[i] = process(input[i]);
    }
}

float SoftLimiter::getGainReduction() const {
    return gainReduction_;
}

void SoftLimiter::calcTimeConstants(float attackMs, float releaseMs, float sampleRate) {
    setAttack(attackMs, sampleRate);
    setRelease(releaseMs, sampleRate);
}

// -- HardClipGuard --

HardClipGuard::HardClipGuard(float ceilingDb) {
    ceiling_ = dbToGain(ceilingDb);
}

float HardClipGuard::process(float input) {
    return clamp(input, -ceiling_, ceiling_);
}

} // namespace voicemod
