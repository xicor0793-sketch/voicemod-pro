export interface VoiceModParams {
  voice: {
    gain: number;        // -20..+20 dB
    pitchShift: number;  // -12..+12 semitones
  };
  eq: {
    lowShelf: number;    // -12..+12 dB
    highShelf: number;   // -12..+12 dB
    midShelf: number;    // -12..+12 dB
    treble: number;      // -12..+12 dB
  };
  spatial: {
    width: number;       // 0..100%
    pan: number;         // -100..+100
    autoPanSpeed: number;// 0..10 Hz
  };
  space: {
    reverbSize: number;  // 0..100%
    reverbMix: number;   // 0..100% wet
  };
  enabled: boolean;
}

export interface VoiceModPreset {
  name: string;
  params: VoiceModParams;
}

export type NativeVoiceModState = VoiceModParams & { active: boolean };

export interface NativeVoiceModModule {
  initEngine(sampleRate: number, bufferSize: number): boolean;
  destroyEngine(): void;
  updateParams(params: VoiceModParams): void;
  processBuffer(inputPtr: number, outputPtr: number, numSamples: number): void;
  getLatency(): number;
  resetEngine(): void;
}
