#pragma once
#include <cmath>
#include <cstddef>
#include "DSPUtils.h"

namespace voicemod {

class SoftLimiter {
public:
    explicit SoftLimiter(float thresholdDb = -1.0f, float kneeDb = 3.0f);

    void setThreshold(float thresholdDb);
    void setKnee(float kneeDb);
    void setRatio(float ratio);
    void setAttack(float attackMs, float sampleRate);
    void setRelease(float releaseMs, float sampleRate);
    void reset();
    float process(float input);
    void processBlock(const float* input, float* output, size_t numSamples);

    float getGainReduction() const;

private:
    float threshold_ = 1.0f; // linear
    float knee_ = 1.0f;
    float ratio_ = 4.0f;
    float attackCoeff_ = 0.0f;
    float releaseCoeff_ = 0.0f;
    float envelope_ = 0.0f;
    float gainReduction_ = 0.0f;

    void calcTimeConstants(float attackMs, float releaseMs, float sampleRate);
};

class HardClipGuard {
public:
    explicit HardClipGuard(float ceilingDb = -0.5f);
    float process(float input);

private:
    float ceiling_ = 0.944f;
};

} // namespace voicemod
