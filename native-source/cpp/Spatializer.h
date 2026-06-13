#pragma once
#include <vector>
#include <cstddef>
#include "DSPUtils.h"

namespace voicemod {

class Spatializer {
public:
    Spatializer();
    ~Spatializer() = default;

    void setSampleRate(float sampleRate);
    void setWidth(float percent);       // 0..100
    void setDelay(float delayMs);       // Haas effect delay 0..40ms
    void reset();

    void processMonoToStereo(const float* mono, float* left, float* right, size_t numSamples);

private:
    float sampleRate_ = 48000.0f;
    float width_ = 0.0f;               // 0..1
    float haasDelayMs_ = 15.0f;       // default ~15ms Haas
    size_t haasDelaySamples_ = 0;

    std::vector<float> delayBufferL_;
    std::vector<float> delayBufferR_;
    size_t writePos_ = 0;

    void updateDelaySize();
};

} // namespace voicemod
