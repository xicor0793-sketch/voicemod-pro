#pragma once
#include <cmath>
#include "DSPUtils.h"

namespace voicemod {

class LFO {
public:
    enum Waveform {
        Sine,
        Triangle,
        Saw,
        Square
    };

    LFO();

    void setFrequency(float freqHz);
    void setSampleRate(float sampleRate);
    void setDepth(float depth);     // 0..1
    void setWaveform(Waveform wave);
    void setPhaseOffset(float offsetRad);

    void reset();
    float process();

    float getValue() const;
    void setPhase(float phase);

private:
    float sampleRate_ = 48000.0f;
    float frequency_ = 1.0f;
    float depth_ = 1.0f;
    float phase_ = 0.0f;
    float phaseIncrement_ = 0.0f;
    Waveform waveform_ = Sine;

    void updatePhaseIncrement();
};

} // namespace voicemod
