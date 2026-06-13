import React from "react";
import { View, Text, TouchableOpacity, ScrollView, TextStyle, ViewStyle } from "react-native";
import type { VoiceModParams, VoiceModPreset } from "../types";
import { PRESETS, DEFAULT_PARAMS } from "../constants";

const styles: Record<string, ViewStyle | TextStyle> = {
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#2f3136",
    borderWidth: 1,
    borderColor: "#40444b",
    marginBottom: 6,
  },
  presetChipActive: {
    backgroundColor: "#00b0f4",
    borderColor: "#00b0f4",
  },
  presetText: {
    fontSize: 13,
    color: "#b9bbbe",
  },
  presetTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#ed4245",
    borderWidth: 1,
    borderColor: "#ed4245",
    marginBottom: 6,
  },
  resetText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
};

interface PresetManagerProps {
  currentParams: VoiceModParams;
  onApply: (params: VoiceModParams) => void;
  disabled?: boolean;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  currentParams,
  onApply,
  disabled = false,
}) => {
  const isPresetActive = (preset: VoiceModPreset) => {
    return JSON.stringify(preset.params) === JSON.stringify(currentParams);
  };

  return (
    <View style={styles.container as ViewStyle}>
      <Text style={styles.title as TextStyle}>Presets</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.presetRow as ViewStyle}>
          {PRESETS.map((preset, idx) => {
            const active = isPresetActive(preset);
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.presetChip as ViewStyle,
                  active && (styles.presetChipActive as ViewStyle),
                  disabled && { opacity: 0.4 },
                ]}
                onPress={() => !disabled && onApply(preset.params)}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.presetText as TextStyle,
                    active && (styles.presetTextActive as TextStyle),
                  ]}
                >
                  {preset.name}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.resetButton as ViewStyle, disabled && { opacity: 0.4 }]}
            onPress={() => !disabled && onApply(DEFAULT_PARAMS)}
            disabled={disabled}
          >
            <Text style={styles.resetText as TextStyle}>Reset</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
