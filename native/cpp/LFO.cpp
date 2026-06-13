#include "LFO.h"

namespace voicemod {

LFO::LFO() = default;

void LFO::setFrequency(float freqHz) {
    frequency_ = clamp(freqHz, 0.001f, 50.0f);
    updatePhaseIncrement();
}

void LFO::setSampleRate(float sampleRate) {
    sampleRate_ = sampleRate;
    updatePhaseIncrement();
}

void LFO::setDepth(float depth) {
    depth_ = clamp(depth, 0.0f, 1.0f);
}

void LFO::setWaveform(Waveform wave) {
    waveform_ = wave;
}

void LFO::setPhaseOffset(float offsetRad) {
    phase_ = std::fmod(offsetRad, TWO_PI);
}

void LFO::reset() {
    phase_ = 0.0f;
}

float LFO::process() {
    float value = 0.0f;

    switch (waveform_) {
        case Sine:
            value = std::sin(phase_);
            break;
        case Triangle:
            value = 2.0f * std::abs(2.0f * (phase_ / TWO_PI - std::floor(phase_ / TWO_PI + 0.5f))) - 1.0f;
            break;
        case Saw:
            value = 2.0f * (phase_ / TWO_PI - std::floor(phase_ / TWO_PI + 0.5f));
            break;
        case Square:
            value = (std::sin(phase_) >= 0.0f) ? 1.0f : -1.0f;
            break;
    }

    phase_ += phaseIncrement_;
    if (phase_ >= TWO_PI) phase_ -= TWO_PI;

    return value * depth_;
}

float LFO::getValue() const {
    return std::sin(phase_) * depth_;
}

void LFO::setPhase(float phase) {
    phase_ = std::fmod(phase, TWO_PI);
}

void LFO::updatePhaseIncrement() {
    phaseIncrement_ = TWO_PI * frequency_ / sampleRate_;
}

} // namespace voicemod
