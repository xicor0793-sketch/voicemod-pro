#pragma once
#include <cmath>
#include <array>
#include "DSPUtils.h"

namespace voicemod {

enum class BiquadType {
    LowPass,
    HighPass,
    BandPass,
    LowShelf,
    HighShelf,
    Peaking,
    Notch,
    AllPass
};

class BiquadFilter {
public:
    BiquadFilter();
    void setType(BiquadType type);
    void setParams(float freq, float q, float gainDb);
    void setSampleRate(float sr);
    void reset();
    float process(float input);
    void processBlock(const float* input, float* output, size_t numSamples);

private:
    void calculateCoefficients();

    BiquadType type_ = BiquadType::LowShelf;
    float sampleRate_ = 48000.0f;
    float freq_ = 1000.0f;
    float q_ = 0.707f;
    float gainDb_ = 0.0f;

    float b0_ = 1.0f, b1_ = 0.0f, b2_ = 0.0f;
    float a0_ = 1.0f, a1_ = 0.0f, a2_ = 0.0f;

    float x1_ = 0.0f, x2_ = 0.0f;
    float y1_ = 0.0f, y2_ = 0.0f;
};

class BiquadFilterBank {
public:
    static constexpr size_t kNumFilters = 4;

    enum FilterIndex {
        LowShelfIdx = 0,
        HighShelfIdx = 1,
        PeakingIdx   = 2,
        TrebleIdx    = 3
    };

    BiquadFilterBank();

    void setSampleRate(float sr);
    void setLowShelf(float gainDb, float freq = 300.0f);
    void setHighShelf(float gainDb, float freq = 4000.0f);
    void setMidShelf(float gainDb, float freq = 1500.0f, float q = 1.0f);
    void setTreble(float gainDb, float freq = 8000.0f);

    void reset();
    float process(float input);
    void processBlock(const float* input, float* output, size_t numSamples);

private:
    std::array<BiquadFilter, kNumFilters> filters_;
};

} // namespace voicemod
