#pragma once
#include <cstddef>
#include "DSPUtils.h"
#include "LFO.h"

namespace voicemod {

class PanSystem {
public:
    PanSystem();
    ~PanSystem() = default;

    void setSampleRate(float sampleRate);
    void setPan(float pan);             // -100..+100 (-1..1)
    void setAutoPanSpeed(float speedHz); // 0..10 Hz
    void setAutoPanDepth(float depth);  // 0..1
    void reset();

    void process(const float* inputL, const float* inputR,
                 float* outputL, float* outputR, size_t numSamples);

private:
    float sampleRate_ = 48000.0f;
    float pan_ = 0.0f;                 // -1..1
    LFO autoPanLfo_;
    float autoPanDepth_ = 0.0f;

    void applyConstantPowerPan(float& left, float& right, float panValue);
};

} // namespace voicemod
