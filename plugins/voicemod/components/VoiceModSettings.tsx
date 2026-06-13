import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, TextStyle, ViewStyle } from "react-native";
import type { VoiceModParams } from "../types";
import { EffectSlider } from "./EffectSlider";
import { PresetManager } from "./PresetManager";
import { SLIDER_CONFIGS } from "../constants";

const styles: Record<string, ViewStyle | TextStyle> = {
  container: {
    flex: 1,
    backgroundColor: "#1e1f22",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#2f3136",
    marginBottom: 12,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: "#2b2d31",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#b9bbbe",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  footer: {
    height: 40,
  },
};

const defaultParams: VoiceModParams = {
  voice: { gain: 0, pitchShift: 0 },
  eq: { lowShelf: 0, highShelf: 0, midShelf: 0, treble: 0 },
  spatial: { width: 0, pan: 0, autoPanSpeed: 0 },
  space: { reverbSize: 30, reverbMix: 0 },
  enabled: true,
};

const cloneParams = (p: VoiceModParams): VoiceModParams => ({
  voice: { ...p.voice },
  eq: { ...p.eq },
  spatial: { ...p.spatial },
  space: { ...p.space },
  enabled: p.enabled,
});

export const VoiceModSettings: React.FC = () => {
  const [params, setParams] = useState<VoiceModParams>(defaultParams);

  const updateParam = useCallback(
    (path: string, value: number | boolean) => {
      setParams((prev) => {
        const next = cloneParams(prev);
        const parts = path.split(".");
        if (parts.length === 1) {
          (next as any)[parts[0]] = value;
        } else if (parts.length === 2) {
          (next as any)[parts[0]][parts[1]] = value;
        }
        return next;
      });
    },
    []
  );

  const applyPreset = useCallback((presetParams: VoiceModParams) => {
    setParams(cloneParams(presetParams));
  }, []);

  return (
    <ScrollView style={styles.container as ViewStyle}>
      <View style={{ paddingVertical: 12 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            color: "#fff",
            textAlign: "center",
            paddingHorizontal: 16,
          }}
        >
          Xicor X Xenon Loud
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: "#b9bbbe",
            textAlign: "center",
            marginTop: 2,
          }}
        >
          Voice Modulation & EQ
        </Text>
      </View>

      <PresetManager
        currentParams={params}
        onApply={applyPreset}
      />

      <View style={styles.section as ViewStyle}>
        <Text style={styles.sectionHeader as TextStyle}>Voice</Text>
        <View style={styles.sectionDivider as ViewStyle} />
        <View style={styles.card as ViewStyle}>
          <EffectSlider
            label="Gain"
            value={params.voice.gain}
            min={SLIDER_CONFIGS.gain.min}
            max={SLIDER_CONFIGS.gain.max}
            step={SLIDER_CONFIGS.gain.step}
            unit={SLIDER_CONFIGS.gain.unit}
            onValueChange={(v) => updateParam("voice.gain", v)}
          />
          <EffectSlider
            label="Pitch Shift"
            value={params.voice.pitchShift}
            min={SLIDER_CONFIGS.pitchShift.min}
            max={SLIDER_CONFIGS.pitchShift.max}
            step={SLIDER_CONFIGS.pitchShift.step}
            unit={SLIDER_CONFIGS.pitchShift.unit}
            onValueChange={(v) => updateParam("voice.pitchShift", v)}
          />
        </View>
      </View>

      <View style={styles.section as ViewStyle}>
        <Text style={styles.sectionHeader as TextStyle}>Equalizer</Text>
        <View style={styles.sectionDivider as ViewStyle} />
        <View style={styles.card as ViewStyle}>
          <EffectSlider
            label="Low Shelf"
            value={params.eq.lowShelf}
            min={SLIDER_CONFIGS.lowShelf.min}
            max={SLIDER_CONFIGS.lowShelf.max}
            step={SLIDER_CONFIGS.lowShelf.step}
            unit={SLIDER_CONFIGS.lowShelf.unit}
            onValueChange={(v) => updateParam("eq.lowShelf", v)}
          />
          <EffectSlider
            label="Mid Shelf (Peaking)"
            value={params.eq.midShelf}
            min={SLIDER_CONFIGS.midShelf.min}
            max={SLIDER_CONFIGS.midShelf.max}
            step={SLIDER_CONFIGS.midShelf.step}
            unit={SLIDER_CONFIGS.midShelf.unit}
            onValueChange={(v) => updateParam("eq.midShelf", v)}
          />
          <EffectSlider
            label="High Shelf"
            value={params.eq.highShelf}
            min={SLIDER_CONFIGS.highShelf.min}
            max={SLIDER_CONFIGS.highShelf.max}
            step={SLIDER_CONFIGS.highShelf.step}
            unit={SLIDER_CONFIGS.highShelf.unit}
            onValueChange={(v) => updateParam("eq.highShelf", v)}
          />
          <EffectSlider
            label="Treble / Drible"
            value={params.eq.treble}
            min={SLIDER_CONFIGS.treble.min}
            max={SLIDER_CONFIGS.treble.max}
            step={SLIDER_CONFIGS.treble.step}
            unit={SLIDER_CONFIGS.treble.unit}
            onValueChange={(v) => updateParam("eq.treble", v)}
          />
        </View>
      </View>

      <View style={styles.section as ViewStyle}>
        <Text style={styles.sectionHeader as TextStyle}>Spatial Audio</Text>
        <View style={styles.sectionDivider as ViewStyle} />
        <View style={styles.card as ViewStyle}>
          <EffectSlider
            label="Stereo Width"
            value={params.spatial.width}
            min={SLIDER_CONFIGS.width.min}
            max={SLIDER_CONFIGS.width.max}
            step={SLIDER_CONFIGS.width.step}
            unit={SLIDER_CONFIGS.width.unit}
            onValueChange={(v) => updateParam("spatial.width", v)}
          />
          <EffectSlider
            label="Pan"
            value={params.spatial.pan}
            min={SLIDER_CONFIGS.pan.min}
            max={SLIDER_CONFIGS.pan.max}
            step={SLIDER_CONFIGS.pan.step}
            unit={SLIDER_CONFIGS.pan.unit}
            onValueChange={(v) => updateParam("spatial.pan", v)}
          />
          <EffectSlider
            label="Auto-Pan Speed"
            value={params.spatial.autoPanSpeed}
            min={SLIDER_CONFIGS.autoPanSpeed.min}
            max={SLIDER_CONFIGS.autoPanSpeed.max}
            step={SLIDER_CONFIGS.autoPanSpeed.step}
            unit={SLIDER_CONFIGS.autoPanSpeed.unit}
            onValueChange={(v) => updateParam("spatial.autoPanSpeed", v)}
          />
        </View>
      </View>

      <View style={styles.section as ViewStyle}>
        <Text style={styles.sectionHeader as TextStyle}>Space / Reverb</Text>
        <View style={styles.sectionDivider as ViewStyle} />
        <View style={styles.card as ViewStyle}>
          <EffectSlider
            label="Reverb Size"
            value={params.space.reverbSize}
            min={SLIDER_CONFIGS.reverbSize.min}
            max={SLIDER_CONFIGS.reverbSize.max}
            step={SLIDER_CONFIGS.reverbSize.step}
            unit={SLIDER_CONFIGS.reverbSize.unit}
            onValueChange={(v) => updateParam("space.reverbSize", v)}
          />
          <EffectSlider
            label="Reverb Mix (Wet/Dry)"
            value={params.space.reverbMix}
            min={SLIDER_CONFIGS.reverbMix.min}
            max={SLIDER_CONFIGS.reverbMix.max}
            step={SLIDER_CONFIGS.reverbMix.step}
            unit={SLIDER_CONFIGS.reverbMix.unit}
            onValueChange={(v) => updateParam("space.reverbMix", v)}
          />
        </View>
      </View>

      <View style={styles.footer as ViewStyle} />
    </ScrollView>
  );
};
