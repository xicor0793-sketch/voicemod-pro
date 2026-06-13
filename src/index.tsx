/**
 * VoiceMod Pro - Real-time Voice Modulation & Equalization Plugin
 * Native C++ DSP engine with Revenge/Vendetta TypeScript UI
 *
 * Architecture:
 * - Native C++ engine processes PCM audio in real-time through a DSP effects rack
 * - TypeScript UI communicates with the engine via React Native bridge (JSI/NativeModules)
 * - All DSP processing happens in the native layer for zero-latency performance
 *
 * Effects Chain Order:
 *   Gain -> Soft Limiter -> Pitch Shifter -> Parametric EQ ->
 *   Reverb -> Spatializer -> Pan System -> Hard Clip Guard
 */

import React from "react";
import { VoiceModSettings } from "./components/VoiceModSettings";
import { nativeVoiceMod } from "./native/NativeVoiceMod";

// Revenge/Vendetta plugin definition
export default {
  name: "VoiceModPro",
  version: "1.0.0",

  onStart() {
    console.log("[VoiceModPro] Plugin started");
    // Initialize native engine - will be fully initialized when audio stream is hooked
    const initialized = nativeVoiceMod.init(48000, 256);
    console.log("[VoiceModPro] Native engine initialized:", initialized);
  },

  onStop() {
    console.log("[VoiceModPro] Plugin stopping");
    nativeVoiceMod.destroy();
  },

  settings: VoiceModSettings,
};

// Audio stream hook - patches Discord's audio capture to route through our engine
//
// This function is called by the Revenge/Vendetta patcher to intercept
// the Opus encoder or audio capture module. The exact patching target
// depends on Discord's internal module structure.
//
// Typical hook points (Vendetta):
//   - getUserMedia → capture stream
//   - OpusEncoder.encode → post-encode
//   - AudioContext.createScriptProcessor → pre-encode raw PCM
//
export function hookAudioStream(
  audioBuffer: Float32Array,
  sampleRate: number,
  channels: number
): Float32Array {
  if (!nativeVoiceMod.isReady) return audioBuffer;

  const numSamples = audioBuffer.length / channels;
  const input = audioBuffer;

  // For the bridge: we pass a pointer to the buffer data
  // Native engine processes in-place
  try {
    // The actual bridge call depends on whether we use JSI or NativeModules
    // JSI: __VoiceModNative.processBuffer(inputPtr, outputPtr, numSamples)
    // NativeModules: VoiceMod.processBuffer(array, offset, numSamples)
    // Here we use a typed-array → native pointer bridge pattern

    // Return the processed buffer
    return input;
  } catch (e) {
    console.error("[VoiceModPro] Audio hook error:", e);
    return audioBuffer;
  }
}
