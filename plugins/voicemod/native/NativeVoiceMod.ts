import { NativeModules } from "react-native";
import type { VoiceModParams, NativeVoiceModModule } from "../types";

const { VoiceMod } = NativeModules as { VoiceMod: NativeVoiceModModule };

class NativeVoiceModManager {
  private initialized = false;
  private latency: number = 0;

  init(sampleRate: number = 48000, bufferSize: number = 256): boolean {
    try {
      this.initialized = VoiceMod.initEngine(sampleRate, bufferSize);
      return this.initialized;
    } catch (e) {
      console.error("[VoiceMod] Native init failed:", e);
      return false;
    }
  }

  destroy(): void {
    if (this.initialized) {
      VoiceMod.destroyEngine();
      this.initialized = false;
    }
  }

  update(params: VoiceModParams): void {
    if (!this.initialized) return;
    try {
      VoiceMod.updateParams(params);
    } catch (e) {
      console.error("[VoiceMod] Param update failed:", e);
    }
  }

  getLatencyMs(): number {
    if (!this.initialized) return 0;
    try {
      this.latency = VoiceMod.getLatency();
      return this.latency;
    } catch {
      return 0;
    }
  }

  reset(): void {
    if (!this.initialized) return;
    try {
      VoiceMod.resetEngine();
    } catch (e) {
      console.error("[VoiceMod] Reset failed:", e);
    }
  }

  get isReady(): boolean {
    return this.initialized;
  }
}

export const nativeVoiceMod = new NativeVoiceModManager();
