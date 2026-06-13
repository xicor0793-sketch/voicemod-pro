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
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#2f3136",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#b9bbbe",
    marginTop: 4,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2b2d31",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  sectionIconText: {
    fontSize: 14,
    color: "#00b0f4",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  sectionCount: {
    fontSize: 11,
    color: "#6d6f78",
    marginLeft: 8,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#2b2d31",
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#33363b",
  },
  cardHighlight: {
    borderColor: "#00b0f4",
    borderWidth: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#33363b",
    marginHorizontal: 12,
  },
  footer: {
    height: 40,
  },
};

const sections = [
  { icon: "🎤", label: "Voice Controls", count: 2, key: "voice" },
  { icon: "🎛️", label: "Equalizer", count: 4, key: "eq" },
  { icon: "🌌", label: "Spatial Audio", count: 3, key: "spatial" },
  { icon: "🏛️", label: "Reverb / Space", count: 2, key: "space" },
] as const;

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

const EQBar: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => {
  const height = Math.abs(value) * 4 + 4;
  const isPositive = value >= 0;
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text
        style={{
          fontSize: 9,
          color: isPositive ? "#4dc9f6" : "#f58b8b",
          fontWeight: "700",
          marginBottom: 2,
        }}
      >
        {value >= 0 ? "+" : ""}
        {value}
      </Text>
      <View
        style={{
          width: 20,
          height: 60,
          backgroundColor: "#1e1f22",
          borderRadius: 4,
          justifyContent: "flex-end",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 28,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: "#555",
          }}
        />
        <View
          style={{
            width: "100%",
            height: Math.min(Math.abs(height), 56),
            backgroundColor: color,
            borderRadius: 2,
            opacity: 0.8,
          }}
        />
      </View>
      <Text
        style={{
          fontSize: 8,
          color: "#6d6f78",
          fontWeight: "600",
          marginTop: 3,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
  );
};

const StatusDot: React.FC<{ active: boolean }> = ({ active }) => (
  <View
    style={{
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: active ? "#3ba55c" : "#6d6f78",
      marginRight: 8,
    }}
  />
);

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
      <View style={styles.header as ViewStyle}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <StatusDot active={true} />
          <Text style={styles.headerTitle as TextStyle}>
            Xicor X Xenon Loud
          </Text>
        </View>
        <Text style={styles.headerSubtitle as TextStyle}>
          Real-time Voice DSP Engine
        </Text>
      </View>

      <PresetManager currentParams={params} onApply={applyPreset} />

      <View style={styles.section as ViewStyle}>
        <View style={styles.sectionHeader as ViewStyle}>
          <View style={styles.sectionIcon as ViewStyle}>
            <Text style={styles.sectionIconText as TextStyle}>📊</Text>
          </View>
          <Text style={styles.sectionTitle as TextStyle}>EQ Visualizer</Text>
          <Text style={styles.sectionCount as TextStyle}>live</Text>
        </View>
        <View
          style={[
            styles.card as ViewStyle,
            { paddingVertical: 12, paddingHorizontal: 8 },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
            <EQBar
              label="Low"
              value={params.eq.lowShelf}
              color="#4dc9f6"
            />
            <EQBar
              label="Mid"
              value={params.eq.midShelf}
              color="#a78bfa"
            />
            <EQBar
              label="High"
              value={params.eq.highShelf}
              color="#f472b6"
            />
            <EQBar
              label="Treble"
              value={params.eq.treble}
              color="#fbbf24"
            />
          </View>
        </View>
      </View>

      {sections.map((section, sIdx) => {
        const sectionParams =
          params[section.key as keyof VoiceModParams];
        if (typeof sectionParams === "boolean") return null;

        const sliderKeys = Object.keys(sectionParams);
        const configKey = section.key === "voice" ? "voice" : section.key;
        const configMap =
          configKey === "voice"
            ? { gain: SLIDER_CONFIGS.gain, pitchShift: SLIDER_CONFIGS.pitchShift }
            : configKey === "eq"
            ? {
                lowShelf: SLIDER_CONFIGS.lowShelf,
                highShelf: SLIDER_CONFIGS.highShelf,
                midShelf: SLIDER_CONFIGS.midShelf,
                treble: SLIDER_CONFIGS.treble,
              }
            : configKey === "spatial"
            ? {
                width: SLIDER_CONFIGS.width,
                pan: SLIDER_CONFIGS.pan,
                autoPanSpeed: SLIDER_CONFIGS.autoPanSpeed,
              }
            : {
                reverbSize: SLIDER_CONFIGS.reverbSize,
                reverbMix: SLIDER_CONFIGS.reverbMix,
              };

        const labelMap: Record<string, string> = {
          gain: "Gain",
          pitchShift: "Pitch Shift",
          lowShelf: "Low Shelf",
          highShelf: "High Shelf",
          midShelf: "Mid Peaking",
          treble: "Treble / Drible",
          width: "Stereo Width",
          pan: "Pan Balance",
          autoPanSpeed: "Auto-Pan Speed",
          reverbSize: "Room Size",
          reverbMix: "Wet / Dry Mix",
        };

        return (
          <View style={styles.section as ViewStyle} key={sIdx}>
            <View style={styles.sectionHeader as ViewStyle}>
              <View style={styles.sectionIcon as ViewStyle}>
                <Text style={styles.sectionIconText as TextStyle}>
                  {section.icon}
                </Text>
              </View>
              <Text style={styles.sectionTitle as TextStyle}>
                {section.label}
              </Text>
              <Text style={styles.sectionCount as TextStyle}>
                {section.count}
              </Text>
            </View>
            <View style={styles.card as ViewStyle}>
              {sliderKeys.map((key, kIdx) => {
                const config =
                  configMap[key as keyof typeof configMap];
                if (!config) return null;
                const val = (sectionParams as any)[key] as number;
                return (
                  <React.Fragment key={key}>
                    {kIdx > 0 && <View style={styles.divider as ViewStyle} />}
                    <EffectSlider
                      label={
                        labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1)
                      }
                      value={val}
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      unit={config.unit}
                      onValueChange={(v) =>
                        updateParam(`${section.key}.${key}`, v)
                      }
                    />
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        );
      })}

      <View style={styles.footer as ViewStyle} />
    </ScrollView>
  );
};
