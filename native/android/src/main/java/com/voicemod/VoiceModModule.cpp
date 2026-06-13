#include <jni.h>
#include <string>
#include <android/log.h>

#include "VoiceModEngine.h"

#define LOG_TAG "VoiceModNative"
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, LOG_TAG, __VA_ARGS__)

static voicemod::VoiceModEngine* gEngine = nullptr;

extern "C" {

JNIEXPORT jlong JNICALL
Java_com_voicemod_VoiceModModule_nativeCreateEngine(JNIEnv* env, jclass clazz) {
    gEngine = new voicemod::VoiceModEngine();
    LOGD("Engine created: %p", gEngine);
    return reinterpret_cast<jlong>(gEngine);
}

JNIEXPORT void JNICALL
Java_com_voicemod_VoiceModModule_nativeDestroyEngine(JNIEnv* env, jclass clazz, jlong ptr) {
    auto* engine = reinterpret_cast<voicemod::VoiceModEngine*>(ptr);
    if (engine) {
        engine->destroy();
        delete engine;
        LOGD("Engine destroyed");
    }
    if (ptr == reinterpret_cast<jlong>(gEngine)) {
        gEngine = nullptr;
    }
}

JNIEXPORT jboolean JNICALL
Java_com_voicemod_VoiceModModule_nativeInitEngine(JNIEnv* env, jclass clazz,
                                                    jlong ptr, jfloat sampleRate, jint bufferSize) {
    auto* engine = reinterpret_cast<voicemod::VoiceModEngine*>(ptr);
    if (!engine) return JNI_FALSE;
    return engine->init(static_cast<float>(sampleRate), static_cast<size_t>(bufferSize)) ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT void JNICALL
Java_com_voicemod_VoiceModModule_nativeUpdateParams(JNIEnv* env, jclass clazz,
                                                      jlong ptr, jfloat gainDb, jfloat pitchShift,
                                                      jfloat lowShelfDb, jfloat highShelfDb,
                                                      jfloat midShelfDb, jfloat trebleDb,
                                                      jfloat spatialWidth, jfloat pan,
                                                      jfloat autoPanSpeed, jfloat reverbSize,
                                                      jfloat reverbMix, jboolean enabled) {
    auto* engine = reinterpret_cast<voicemod::VoiceModEngine*>(ptr);
    if (!engine) return;

    voicemod::VoiceModParams params;
    params.gainDb = gainDb;
    params.pitchShiftSemitones = pitchShift;
    params.lowShelfDb = lowShelfDb;
    params.highShelfDb = highShelfDb;
    params.midShelfDb = midShelfDb;
    params.trebleDb = trebleDb;
    params.spatialWidth = spatialWidth;
    params.pan = pan;
    params.autoPanSpeed = autoPanSpeed;
    params.reverbSize = reverbSize;
    params.reverbMix = reverbMix;
    params.enabled = enabled == JNI_TRUE;

    engine->updateParams(params);
}

JNIEXPORT void JNICALL
Java_com_voicemod_VoiceModModule_nativeProcessBuffer(JNIEnv* env, jclass clazz,
                                                       jlong ptr, jfloatArray buffer,
                                                       jint offset, jint numSamples) {
    auto* engine = reinterpret_cast<voicemod::VoiceModEngine*>(ptr);
    if (!engine) return;

    jfloat* elements = env->GetFloatArrayElements(buffer, nullptr);
    if (!elements) return;

    engine->processInterleaved(elements + offset, elements + offset,
                                static_cast<size_t>(numSamples));

    env->ReleaseFloatArrayElements(buffer, elements, 0);
}

JNIEXPORT jfloat JNICALL
Java_com_voicemod_VoiceModModule_nativeGetLatency(JNIEnv* env, jclass clazz, jlong ptr) {
    auto* engine = reinterpret_cast<voicemod::VoiceModEngine*>(ptr);
    if (!engine) return 0.0f;
    return engine->getLatencyMs();
}

JNIEXPORT void JNICALL
Java_com_voicemod_VoiceModModule_nativeResetEngine(JNIEnv* env, jclass clazz, jlong ptr) {
    auto* engine = reinterpret_cast<voicemod::VoiceModEngine*>(ptr);
    if (!engine) return;
    engine->reset();
}

} // extern "C"
