package com.voicemod;

import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

public class VoiceModModule extends ReactContextBaseJavaModule {

    private static final String TAG = "VoiceMod";
    private static final String MODULE_NAME = "VoiceMod";

    private long nativeEnginePtr = 0;

    // Native methods
    private static native long nativeCreateEngine();
    private static native void nativeDestroyEngine(long ptr);
    private static native boolean nativeInitEngine(long ptr, float sampleRate, int bufferSize);
    private static native void nativeUpdateParams(long ptr, float gainDb, float pitchShift,
                                                   float lowShelfDb, float highShelfDb,
                                                   float midShelfDb, float trebleDb,
                                                   float spatialWidth, float pan,
                                                   float autoPanSpeed, float reverbSize,
                                                   float reverbMix, boolean enabled);
    private static native void nativeProcessBuffer(long ptr, float[] buffer, int offset, int numSamples);
    private static native float nativeGetLatency(long ptr);
    private static native void nativeResetEngine(long ptr);

    public VoiceModModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    static {
        try {
            System.loadLibrary("voicemod_native");
            Log.d(TAG, "Native library loaded successfully");
        } catch (UnsatisfiedLinkError e) {
            Log.e(TAG, "Failed to load native library: " + e.getMessage());
        }
    }

    @ReactMethod
    public void initEngine(double sampleRate, double bufferSize, Promise promise) {
        try {
            if (nativeEnginePtr == 0) {
                nativeEnginePtr = nativeCreateEngine();
            }
            boolean result = nativeInitEngine(nativeEnginePtr,
                    (float) sampleRate, (int) bufferSize);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("INIT_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void destroyEngine() {
        if (nativeEnginePtr != 0) {
            nativeDestroyEngine(nativeEnginePtr);
            nativeEnginePtr = 0;
        }
    }

    @ReactMethod
    public void updateParams(ReadableMap params) {
        if (nativeEnginePtr == 0) return;

        try {
            ReadableMap voice = params.getMap("voice");
            ReadableMap eq = params.getMap("eq");
            ReadableMap spatial = params.getMap("spatial");
            ReadableMap space = params.getMap("space");

            float gainDb = voice != null ? (float) voice.getDouble("gain") : 0f;
            float pitchShift = voice != null ? (float) voice.getDouble("pitchShift") : 0f;

            float lowShelfDb = eq != null ? (float) eq.getDouble("lowShelf") : 0f;
            float highShelfDb = eq != null ? (float) eq.getDouble("highShelf") : 0f;
            float midShelfDb = eq != null ? (float) eq.getDouble("midShelf") : 0f;
            float trebleDb = eq != null ? (float) eq.getDouble("treble") : 0f;

            float spatialWidth = spatial != null ? (float) spatial.getDouble("width") : 0f;
            float pan = spatial != null ? (float) spatial.getDouble("pan") : 0f;
            float autoPanSpeed = spatial != null ? (float) spatial.getDouble("autoPanSpeed") : 0f;

            float reverbSize = space != null ? (float) space.getDouble("reverbSize") : 0.3f;
            float reverbMix = space != null ? (float) space.getDouble("reverbMix") : 0f;

            boolean enabled = params.hasKey("enabled") && params.getBoolean("enabled");

            nativeUpdateParams(nativeEnginePtr, gainDb, pitchShift,
                    lowShelfDb, highShelfDb, midShelfDb, trebleDb,
                    spatialWidth, pan, autoPanSpeed, reverbSize, reverbMix, enabled);
        } catch (Exception e) {
            Log.e(TAG, "Failed to update params: " + e.getMessage());
        }
    }

    @ReactMethod
    public void processBuffer(float[] buffer, int offset, int numSamples) {
        if (nativeEnginePtr == 0) return;
        nativeProcessBuffer(nativeEnginePtr, buffer, offset, numSamples);
    }

    @ReactMethod
    public void getLatency(Promise promise) {
        if (nativeEnginePtr == 0) {
            promise.resolve(0.0);
            return;
        }
        promise.resolve((double) nativeGetLatency(nativeEnginePtr));
    }

    @ReactMethod
    public void resetEngine() {
        if (nativeEnginePtr == 0) return;
        nativeResetEngine(nativeEnginePtr);
    }
}
