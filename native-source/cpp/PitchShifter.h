#pragma once
#include <vector>
#include <cstddef>
#include "DSPUtils.h"

namespace voicemod {

class PitchShifter {
public:
    PitchShifter();
    ~PitchShifter() = default;

    void setSampleRate(float sampleRate);
    void setPitchShift(float semitones); // -12..+12
    void setWindowSize(float ms);
    void reset();

    float process(float input);
    void processBlock(const float* input, float* output, size_t numSamples);

private:
    float sampleRate_ = 48000.0f;
    float pitchRatio_ = 1.0f; // 1.0 = no shift
    float windowSize_ = 30.0f; // ms

    size_t windowLen_ = 0;
    size_t analysisHop_ = 0;
    size_t synthesisHop_ = 0;
    size_t writePos_ = 0;
    size_t readPos_ = 0;
    size_t inputBufferSize_ = 0;

    std::vector<float> inputBuffer_;
    std::vector<float> outputBuffer_;
    std::vector<float> window_;

    float deltaWritePos_ = 0.0f;
    float deltaReadPos_ = 0.0f;

    void updateParameters();
    void applyWindow(float* block, size_t len);
    float findBestOverlap(const float* search, const float* target, size_t len, size_t maxShift);
};

} // namespace voicemod
