#include "PanSystem.h"
#include <cmath>

namespace voicemod {

PanSystem::PanSystem() {
    autoPanLfo_.setSampleRate(sampleRate_);
    autoPanLfo_.setWaveform(LFO::Sine);
    autoPanLfo_.setDepth(0.0f);
}

void PanSystem::setSampleRate(float sampleRate) {
    sampleRate_ = sampleRate;
    autoPanLfo_.setSampleRate(sampleRate);
}

void PanSystem::setPan(float pan) {
    pan_ = clamp(pan / 100.0f, -1.0f, 1.0f);
}

void PanSystem::setAutoPanSpeed(float speedHz) {
    autoPanLfo_.setFrequency(clamp(speedHz, 0.0f, 10.0f));
}

void PanSystem::setAutoPanDepth(float depth) {
    autoPanDepth_ = clamp(depth, 0.0f, 1.0f);
    autoPanLfo_.setDepth(autoPanDepth_);
}

void PanSystem::reset() {
    autoPanLfo_.reset();
}

void PanSystem::process(const float* inputL, const float* inputR,
                        float* outputL, float* outputR, size_t numSamples) {
    for (size_t i = 0; i < numSamples; ++i) {
        float l = inputL[i];
        float r = inputR[i];

        float lfoMod = autoPanLfo_.process() * autoPanDepth_;
        float effectivePan = clamp(pan_ + lfoMod, -1.0f, 1.0f);

        applyConstantPowerPan(l, r, effectivePan);

        outputL[i] = l;
        outputR[i] = r;
    }
}

void PanSystem::applyConstantPowerPan(float& left, float& right, float panValue) {
    float angle = panValue * PI * 0.25f; // -π/4 to π/4
    float cosAngle = std::cos(angle);
    float sinAngle = std::sin(angle);

    float m = (left + right) * 0.5f;
    float s = (left - right) * 0.5f;

    left = m * cosAngle + s * sinAngle;
    right = m * cosAngle - s * sinAngle;
}

} // namespace voicemod
