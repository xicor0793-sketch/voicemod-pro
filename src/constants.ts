import type { VoiceModParams, VoiceModPreset } from "./types";

export const DEFAULT_PARAMS: VoiceModParams = {
  voice: { gain: 0, pitchShift: 0 },
  eq: { lowShelf: 0, highShelf: 0, midShelf: 0, treble: 0 },
  spatial: { width: 0, pan: 0, autoPanSpeed: 0 },
  space: { reverbSize: 30, reverbMix: 0 },
  enabled: false,
};

export const PRESETS: VoiceModPreset[] = [
  {
    name: "Default (Flat)",
    params: DEFAULT_PARAMS,
  },
  {
    name: "Radio Voice",
    params: {
      voice: { gain: 3, pitchShift: 0 },
      eq: { lowShelf: -4, highShelf: 6, midShelf: -2, treble: 8 },
      spatial: { width: 0, pan: 0, autoPanSpeed: 0 },
      space: { reverbSize: 20, reverbMix: 15 },
      enabled: true,
    },
  },
  {
    name: "Deep Bass",
    params: {
      voice: { gain: 2, pitchShift: -3 },
      eq: { lowShelf: 8, highShelf: -3, midShelf: 0, treble: -2 },
      spatial: { width: 20, pan: 0, autoPanSpeed: 0 },
      space: { reverbSize: 40, reverbMix: 20 },
      enabled: true,
    },
  },
  {
    name: "Chipmunk",
    params: {
      voice: { gain: 4, pitchShift: 7 },
      eq: { lowShelf: -6, highShelf: 4, midShelf: 0, treble: 6 },
      spatial: { width: 0, pan: 0, autoPanSpeed: 0 },
      space: { reverbSize: 0, reverbMix: 0 },
      enabled: true,
    },
  },
  {
    name: "Robotic",
    params: {
      voice: { gain: 1, pitchShift: -2 },
      eq: { lowShelf: -2, highShelf: 3, midShelf: 6, treble: 2 },
      spatial: { width: 40, pan: 0, autoPanSpeed: 0.5 },
      space: { reverbSize: 10, reverbMix: 5 },
      enabled: true,
    },
  },
  {
    name: "Cathedral",
    params: {
      voice: { gain: -2, pitchShift: 0 },
      eq: { lowShelf: 2, highShelf: 4, midShelf: -1, treble: 3 },
      spatial: { width: 80, pan: 0, autoPanSpeed: 0 },
      space: { reverbSize: 90, reverbMix: 60 },
      enabled: true,
    },
  },
  {
    name: "Telephone",
    params: {
      voice: { gain: 5, pitchShift: 0 },
      eq: { lowShelf: -10, highShelf: -6, midShelf: 8, treble: -8 },
      spatial: { width: 0, pan: 0, autoPanSpeed: 0 },
      space: { reverbSize: 0, reverbMix: 0 },
      enabled: true,
    },
  },
];

export const SLIDER_CONFIGS = {
  gain: { min: -20, max: 20, step: 0.5, unit: "dB" },
  pitchShift: { min: -12, max: 12, step: 1, unit: "st" },
  lowShelf: { min: -12, max: 12, step: 0.5, unit: "dB" },
  highShelf: { min: -12, max: 12, step: 0.5, unit: "dB" },
  midShelf: { min: -12, max: 12, step: 0.5, unit: "dB" },
  treble: { min: -12, max: 12, step: 0.5, unit: "dB" },
  width: { min: 0, max: 100, step: 1, unit: "%" },
  pan: { min: -100, max: 100, step: 1, unit: "" },
  autoPanSpeed: { min: 0, max: 10, step: 0.1, unit: "Hz" },
  reverbSize: { min: 0, max: 100, step: 1, unit: "%" },
  reverbMix: { min: 0, max: 100, step: 1, unit: "%" },
} as const;
