#include "BiquadFilter.h"

namespace voicemod {

BiquadFilter::BiquadFilter() = default;

void BiquadFilter::setType(BiquadType type) {
    if (type_ != type) {
        type_ = type;
        calculateCoefficients();
    }
}

void BiquadFilter::setParams(float freq, float q, float gainDb) {
    freq_ = freq;
    q_ = q;
    gainDb_ = gainDb;
    calculateCoefficients();
}

void BiquadFilter::setSampleRate(float sr) {
    if (std::abs(sampleRate_ - sr) > 0.1f) {
        sampleRate_ = sr;
        calculateCoefficients();
    }
}

void BiquadFilter::reset() {
    x1_ = x2_ = y1_ = y2_ = 0.0f;
}

float BiquadFilter::process(float input) {
    float output = (b0_ / a0_) * input + (b1_ / a0_) * x1_ + (b2_ / a0_) * x2_
                   - (a1_ / a0_) * y1_ - (a2_ / a0_) * y2_;

    x2_ = x1_;
    x1_ = input;
    y2_ = y1_;
    y1_ = output;

    return output;
}

void BiquadFilter::processBlock(const float* input, float* output, size_t numSamples) {
    for (size_t i = 0; i < numSamples; ++i) {
        output[i] = process(input[i]);
    }
}

void BiquadFilter::calculateCoefficients() {
    float w0 = TWO_PI * freq_ / sampleRate_;
    float cosW0 = std::cos(w0);
    float sinW0 = std::sin(w0);
    float alpha = sinW0 / (2.0f * q_);
    float A = std::pow(10.0f, gainDb_ / 40.0f);
    float sqrtA = std::sqrt(A);
    float twoSqrtAAlpha = 2.0f * sqrtA * alpha;

    switch (type_) {
        case BiquadType::LowShelf: {
            b0_ = A * ((A + 1.0f) - (A - 1.0f) * cosW0 + twoSqrtAAlpha);
            b1_ = 2.0f * A * ((A - 1.0f) - (A + 1.0f) * cosW0);
            b2_ = A * ((A + 1.0f) - (A - 1.0f) * cosW0 - twoSqrtAAlpha);
            a0_ = (A + 1.0f) + (A - 1.0f) * cosW0 + twoSqrtAAlpha;
            a1_ = -2.0f * ((A - 1.0f) + (A + 1.0f) * cosW0);
            a2_ = (A + 1.0f) + (A - 1.0f) * cosW0 - twoSqrtAAlpha;
            break;
        }
        case BiquadType::HighShelf: {
            b0_ = A * ((A + 1.0f) + (A - 1.0f) * cosW0 + twoSqrtAAlpha);
            b1_ = -2.0f * A * ((A - 1.0f) + (A + 1.0f) * cosW0);
            b2_ = A * ((A + 1.0f) + (A - 1.0f) * cosW0 - twoSqrtAAlpha);
            a0_ = (A + 1.0f) - (A - 1.0f) * cosW0 + twoSqrtAAlpha;
            a1_ = 2.0f * ((A - 1.0f) - (A + 1.0f) * cosW0);
            a2_ = (A + 1.0f) - (A - 1.0f) * cosW0 - twoSqrtAAlpha;
            break;
        }
        case BiquadType::Peaking: {
            b0_ = 1.0f + alpha * A;
            b1_ = -2.0f * cosW0;
            b2_ = 1.0f - alpha * A;
            a0_ = 1.0f + alpha / A;
            a1_ = -2.0f * cosW0;
            a2_ = 1.0f - alpha / A;
            break;
        }
        case BiquadType::HighPass: {
            b0_ = (1.0f + cosW0) / 2.0f;
            b1_ = -(1.0f + cosW0);
            b2_ = (1.0f + cosW0) / 2.0f;
            a0_ = 1.0f + alpha;
            a1_ = -2.0f * cosW0;
            a2_ = 1.0f - alpha;
            break;
        }
        case BiquadType::LowPass: {
            b0_ = (1.0f - cosW0) / 2.0f;
            b1_ = 1.0f - cosW0;
            b2_ = (1.0f - cosW0) / 2.0f;
            a0_ = 1.0f + alpha;
            a1_ = -2.0f * cosW0;
            a2_ = 1.0f - alpha;
            break;
        }
        default:
            break;
    }
}

// -- BiquadFilterBank --

BiquadFilterBank::BiquadFilterBank() {
    filters_[LowShelfIdx].setType(BiquadType::LowShelf);
    filters_[LowShelfIdx].setParams(300.0f, 0.707f, 0.0f);

    filters_[HighShelfIdx].setType(BiquadType::HighShelf);
    filters_[HighShelfIdx].setParams(4000.0f, 0.707f, 0.0f);

    filters_[PeakingIdx].setType(BiquadType::Peaking);
    filters_[PeakingIdx].setParams(1500.0f, 1.0f, 0.0f);

    filters_[TrebleIdx].setType(BiquadType::HighShelf);
    filters_[TrebleIdx].setParams(8000.0f, 0.6f, 0.0f);
}

void BiquadFilterBank::setSampleRate(float sr) {
    for (auto& f : filters_) f.setSampleRate(sr);
}

void BiquadFilterBank::setLowShelf(float gainDb, float freq) {
    filters_[LowShelfIdx].setParams(freq, 0.707f, gainDb);
}

void BiquadFilterBank::setHighShelf(float gainDb, float freq) {
    filters_[HighShelfIdx].setParams(freq, 0.707f, gainDb);
}

void BiquadFilterBank::setMidShelf(float gainDb, float freq, float q) {
    filters_[PeakingIdx].setParams(freq, q, gainDb);
}

void BiquadFilterBank::setTreble(float gainDb, float freq) {
    filters_[TrebleIdx].setParams(freq, 0.6f, gainDb);
}

void BiquadFilterBank::reset() {
    for (auto& f : filters_) f.reset();
}

float BiquadFilterBank::process(float input) {
    float out = input;
    for (auto& f : filters_) out = f.process(out);
    return out;
}

void BiquadFilterBank::processBlock(const float* input, float* output, size_t numSamples) {
    float buf[2][2048];
    constexpr size_t kMaxSamples = 2048;
    size_t toProcess = numSamples;

    const float* src = input;
    float* dst = output;

    for (size_t idx = 0; idx < kNumFilters; ++idx) {
        filters_[idx].processBlock(src, buf[idx % 2], toProcess);
        src = buf[idx % 2];
        dst = (idx == kNumFilters - 1) ? output : buf[(idx + 1) % 2];
        dst = output;
        src = (idx == kNumFilters - 1) ? src : buf[idx % 2];
    }

    if (kNumFilters % 2 == 0 && src != output) {
        std::copy(src, src + toProcess, output);
    }
}

} // namespace voicemod
