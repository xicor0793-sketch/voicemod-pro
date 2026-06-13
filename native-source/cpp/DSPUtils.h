#pragma once
#include <cmath>
#include <cstdint>
#include <algorithm>

namespace voicemod {

constexpr double PI = 3.14159265358979323846;
constexpr double TWO_PI = 2.0 * PI;
constexpr double INV_PI = 1.0 / PI;
constexpr double LN_10_OVER_20 = 0.1151292546497022; // ln(10)/20

inline float dbToGain(float db) {
    return std::pow(10.0f, db / 20.0f);
}

inline float gainToDb(float gain) {
    return 20.0f * std::log10(std::max(gain, 1e-10f));
}

inline float softClipTanh(float x) {
    if (x > 3.0f) return 1.0f;
    if (x < -3.0f) return -1.0f;
    float x2 = x * x;
    float a = x * (135135.0f + x2 * (17325.0f + x2 * (693.0f + x2 * 15.0f)));
    float b = 135135.0f + x2 * (62370.0f + x2 * (3150.0f + x2 * 28.0f));
    return a / b;
}

inline float softClipArctan(float x, float threshold = 1.0f) {
    return (2.0f / PI) * std::atan(x * PI * 0.5f / threshold) * threshold;
}

inline float lerp(float a, float b, float t) {
    return a + (b - a) * t;
}

inline float clamp(float v, float lo, float hi) {
    return std::max(lo, std::min(v, hi));
}

inline float msToSamples(float ms, float sampleRate) {
    return ms * 0.001f * sampleRate;
}

inline float samplesToMs(float samples, float sampleRate) {
    return samples / sampleRate * 1000.0f;
}

inline uint32_t nextPowerOf2(uint32_t v) {
    v--;
    v |= v >> 1;
    v |= v >> 2;
    v |= v >> 4;
    v |= v >> 8;
    v |= v >> 16;
    return v + 1;
}

inline float sinc(float x) {
    if (std::abs(x) < 1e-8f) return 1.0f;
    return std::sin(x) / x;
}

struct GainResult {
    float level;      // linear gain multiplier
    float makeup;     // post-clip makeup gain
};

inline GainResult calculateBoost(float dbGain) {
    float linearGain = dbToGain(dbGain);
    float level = linearGain;
    float makeup = 1.0f;
    if (level > 1.0f) {
        float clippedEstimate = 1.0f / level;
        float attenuation = 1.0f - (1.0f - clippedEstimate) * 0.5f;
        level = level * attenuation;
        makeup = 1.0f / attenuation;
    }
    return { level, makeup };
}

} // namespace voicemod
