#pragma once
#include <atomic>
#include <mutex>
#include <cstddef>
#include "DSPUtils.h"
#include "BiquadFilter.h"
#include "PitchShifter.h"
#include "ReverbEngine.h"
#include "Spatializer.h"
#include "PanSystem.h"
#include "Limiter.h"
#include "LFO.h"

namespace voicemod {

struct VoiceModParams {
    // Voice
    float gainDb = 0.0f;
    float pitchShiftSemitones = 0.0f;

    // EQ
    float lowShelfDb = 0.0f;
    float highShelfDb = 0.0f;
    float midShelfDb = 0.0f;
    float trebleDb = 0.0f;

    // Spatial
    float spatialWidth = 0.0f;
    float pan = 0.0f;
    float autoPanSpeed = 0.0f;

    // Space
    float reverbSize = 0.3f;
    float reverbMix = 0.0f;

    // State
    bool enabled = false;
};

class VoiceModEngine {
public:
    VoiceModEngine();
    ~VoiceModEngine() = default;

    bool init(float sampleRate, size_t bufferSize);
    void destroy();
    void reset();

    void updateParams(const VoiceModParams& params);
    void process(float* input, float* output, size_t numSamples);
    void processInterleaved(float* input, float* output, size_t numFrames);

    float getLatencyMs() const;
    float getPeakLevel() const;
    float getGainReduction() const;

private:
    std::atomic<bool> initialized_{false};
    std::atomic<bool> enabled_{false};
    std::mutex paramMutex_;

    float sampleRate_ = 48000.0f;
    size_t bufferSize_ = 256;

    VoiceModParams currentParams_;
    VoiceModParams pendingParams_;

    // DSP Modules (processing chain)
    float gainLinear_ = 1.0f;
    SoftLimiter limiter_;
    HardClipGuard clipGuard_;
    PitchShifter pitchShifter_;
    BiquadFilterBank eqBank_;
    Spatializer spatializer_;
    PanSystem panSystem_;
    ReverbEngine reverb_;

    float peakLevel_ = 0.0f;
    float gainReduction_ = 1.0f;

    // Output buffers (pre-allocated)
    float* monoScratch_ = nullptr;
    float* stereoScratchL_ = nullptr;
    float* stereoScratchR_ = nullptr;
    size_t scratchSize_ = 0;

    void allocateScratch(size_t size);
    void deallocateScratch();
    void applyParams(const VoiceModParams& params);
    void applyGain(const float* input, float* output, size_t numSamples);
};

} // namespace voicemod
