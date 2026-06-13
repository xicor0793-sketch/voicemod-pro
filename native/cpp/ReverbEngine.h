#pragma once
#include <vector>
#include <array>
#include <cstddef>
#include "DSPUtils.h"

namespace voicemod {

class CombFilter {
public:
    CombFilter();
    void setDelay(float ms, float sampleRate);
    void setDecay(float decay);
    void setDampening(float damp); // 0..1
    void reset();
    float process(float input);

private:
    std::vector<float> buffer_;
    size_t bufferSize_ = 0;
    size_t writePos_ = 0;
    float decay_ = 0.5f;
    float dampening_ = 0.0f;
    float lastOutput_ = 0.0f;
};

class AllPassFilter {
public:
    AllPassFilter();
    void setDelay(float ms, float sampleRate);
    void setGain(float gain);
    void reset();
    float process(float input);

private:
    std::vector<float> buffer_;
    size_t bufferSize_ = 0;
    size_t writePos_ = 0;
    float gain_ = 0.5f;
};

class ReverbEngine {
public:
    static constexpr size_t kNumCombs = 8;
    static constexpr size_t kNumAllPasses = 4;

    ReverbEngine();
    ~ReverbEngine() = default;

    void setSampleRate(float sampleRate);
    void setRoomSize(float size);     // 0..1
    void setDampening(float damp);    // 0..1
    void setWetMix(float wet);        // 0..1
    void setDryMix(float dry);        // 0..1
    void setWidth(float width);       // 0..1

    void reset();
    float process(float input);

    void processBlock(const float* input, float* output, size_t numSamples);

private:
    float sampleRate_ = 48000.0f;
    float roomSize_ = 0.5f;
    float dampening_ = 0.5f;
    float wetMix_ = 0.33f;
    float dryMix_ = 0.67f;
    float width_ = 0.5f;

    std::array<CombFilter, kNumCombs> combs_;
    std::array<AllPassFilter, kNumAllPasses> allPasses_;

    static constexpr float kCombDelaysMs[kNumCombs] = {
        29.7f, 37.1f, 41.1f, 43.7f,
        31.3f, 39.5f, 42.3f, 45.1f
    };
    static constexpr float kAllPassDelaysMs[kNumAllPasses] = {
        5.0f, 1.7f, 4.5f, 2.8f
    };

    void updateCombParams();
    void updateAllPassParams();
    float monoToStereo(float mono, float* leftOut, float* rightOut);
};

} // namespace voicemod
