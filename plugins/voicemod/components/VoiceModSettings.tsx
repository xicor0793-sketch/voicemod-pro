import React, { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextStyle, ViewStyle } from "react-native";
import type { VoiceModParams } from "../types";
import { EffectSlider } from "./EffectSlider";
import { PresetManager } from "./PresetManager";
import { SLIDER_CONFIGS } from "../constants";
import { nativeVoiceMod } from "../native/NativeVoiceMod";

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
  latencyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#2b2d31",
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  latencyLabel: {
    fontSize: 12,
    color: "#b9bbbe",
  },
  latencyValue: {
    fontSize: 12,
    color: "#00b0f4",
    fontFamily: "monospace",
  },
  footer: {
    height: 40,
  },
};

// Toggle switch component matching Vendetta's patched FormSwitch
const Toggle: React.FC<{
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}> = ({ label, value, onValueChange, disabled = false }) => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: "#2b2d31",
      marginHorizontal: 16,
      borderRadius: 8,
      marginBottom: 12,
      opacity: disabled ? 0.4 : 1,
    }}
  >
    <Text style={{ fontSize: 16, color: "#fff", fontWeight: "600" }}>
      {label}
    </Text>
    <TouchableOpacity
      onPress={() => !disabled && onValueChange(!value)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: value ? "#00b0f4" : "#40444b",
        justifyContent: "center",
        paddingHorizontal: 2,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: "#fff",
          alignSelf: value ? "flex-end" : "flex-start",
        }}
      />
    </TouchableOpacity>
  </View>
);

interface VoiceModSettingsProps {
  initialParams?: VoiceModParams;
}

export const VoiceModSettings: React.FC<VoiceModSettingsProps> = ({
  initialParams,
}) => {
  const [params, setParams] = useState<VoiceModParams>(
    initialParams || {
      voice: { gain: 0, pitchShift: 0 },
      eq: { lowShelf: 0, highShelf: 0, midShelf: 0, treble: 0 },
      spatial: { width: 0, pan: 0, autoPanSpeed: 0 },
      space: { reverbSize: 30, reverbMix: 0 },
      enabled: false,
    }
  );
  const [latencyMs, setLatencyMs] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (nativeVoiceMod.isReady) {
        setLatencyMs(nativeVoiceMod.getLatencyMs());
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateParam = useCallback(
    (path: string, value: number | boolean) => {
      setParams((prev) => {
        const next = structuredClone(prev);
        const parts = path.split(".");
        if (parts.length === 1) {
          (next as any)[parts[0]] = value;
        } else if (parts.length === 2) {
          (next as any)[parts[0]][parts[1]] = value;
        }
        nativeVoiceMod.update(next);
        return next;
      });
    },
    []
  );

  const applyPreset = useCallback((presetParams: VoiceModParams) => {
    setParams(presetParams);
    nativeVoiceMod.update(presetParams);
  }, []);

  return (
    <ScrollView style={styles.container as ViewStyle}>
      {/* Master Toggle */}
      <Toggle
        label="VoiceMod Pro"
        value={params.enabled}
        onValueChange={(v) => updateParam("enabled", v)}
      />

      {/* Latency Display */}
      <View style={styles.latencyRow as ViewStyle}>
        <Text style={styles.latencyLabel as TextStyle}>Engine Latency</Text>
        <Text style={styles.latencyValue as TextStyle}>
          {nativeVoiceMod.isReady
            ? `${latencyMs.toFixed(1)} ms`
            : "Not initialized"}
        </Text>
      </View>

      {/* Presets */}
      <PresetManager
        currentParams={params}
        onApply={applyPreset}
        disabled={!params.enabled}
      />

      {/* Voice Section */}
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
            disabled={!params.enabled}
          />
          <EffectSlider
            label="Pitch Shift"
            value={params.voice.pitchShift}
            min={SLIDER_CONFIGS.pitchShift.min}
            max={SLIDER_CONFIGS.pitchShift.max}
            step={SLIDER_CONFIGS.pitchShift.step}
            unit={SLIDER_CONFIGS.pitchShift.unit}
            onValueChange={(v) => updateParam("voice.pitchShift", v)}
            disabled={!params.enabled}
          />
        </View>
      </View>

      {/* EQ Section */}
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
            disabled={!params.enabled}
          />
          <EffectSlider
            label="Mid Shelf (Peaking)"
            value={params.eq.midShelf}
            min={SLIDER_CONFIGS.midShelf.min}
            max={SLIDER_CONFIGS.midShelf.max}
            step={SLIDER_CONFIGS.midShelf.step}
            unit={SLIDER_CONFIGS.midShelf.unit}
            onValueChange={(v) => updateParam("eq.midShelf", v)}
            disabled={!params.enabled}
          />
          <EffectSlider
            label="High Shelf"
            value={params.eq.highShelf}
            min={SLIDER_CONFIGS.highShelf.min}
            max={SLIDER_CONFIGS.highShelf.max}
            step={SLIDER_CONFIGS.highShelf.step}
            unit={SLIDER_CONFIGS.highShelf.unit}
            onValueChange={(v) => updateParam("eq.highShelf", v)}
            disabled={!params.enabled}
          />
          <EffectSlider
            label="Treble / Drible"
            value={params.eq.treble}
            min={SLIDER_CONFIGS.treble.min}
            max={SLIDER_CONFIGS.treble.max}
            step={SLIDER_CONFIGS.treble.step}
            unit={SLIDER_CONFIGS.treble.unit}
            onValueChange={(v) => updateParam("eq.treble", v)}
            disabled={!params.enabled}
          />
        </View>
      </View>

      {/* Spatial Section */}
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
            disabled={!params.enabled}
          />
          <EffectSlider
            label="Pan"
            value={params.spatial.pan}
            min={SLIDER_CONFIGS.pan.min}
            max={SLIDER_CONFIGS.pan.max}
            step={SLIDER_CONFIGS.pan.step}
            unit={SLIDER_CONFIGS.pan.unit}
            onValueChange={(v) => updateParam("spatial.pan", v)}
            disabled={!params.enabled}
          />
          <EffectSlider
            label="Auto-Pan Speed"
            value={params.spatial.autoPanSpeed}
            min={SLIDER_CONFIGS.autoPanSpeed.min}
            max={SLIDER_CONFIGS.autoPanSpeed.max}
            step={SLIDER_CONFIGS.autoPanSpeed.step}
            unit={SLIDER_CONFIGS.autoPanSpeed.unit}
            onValueChange={(v) => updateParam("spatial.autoPanSpeed", v)}
            disabled={!params.enabled}
          />
        </View>
      </View>

      {/* Space / Reverb Section */}
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
            disabled={!params.enabled}
          />
          <EffectSlider
            label="Reverb Mix (Wet/Dry)"
            value={params.space.reverbMix}
            min={SLIDER_CONFIGS.reverbMix.min}
            max={SLIDER_CONFIGS.reverbMix.max}
            step={SLIDER_CONFIGS.reverbMix.step}
            unit={SLIDER_CONFIGS.reverbMix.unit}
            onValueChange={(v) => updateParam("space.reverbMix", v)}
            disabled={!params.enabled}
          />
        </View>
      </View>

      <View style={styles.footer as ViewStyle} />
    </ScrollView>
  );
};
