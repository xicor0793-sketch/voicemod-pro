import React from "react";
import { View, Text, TouchableOpacity, ScrollView, TextStyle, ViewStyle } from "react-native";
import type { VoiceModParams, VoiceModPreset } from "../types";
import { PRESETS, DEFAULT_PARAMS } from "../constants";

interface PresetManagerProps {
  currentParams: VoiceModParams;
  onApply: (params: VoiceModParams) => void;
  disabled?: boolean;
}

const presetColors = [
  "#6d6f78",
  "#4dc9f6",
  "#3ba55c",
  "#fbbf24",
  "#a78bfa",
  "#f472b6",
  "#f58b8b",
  "#ed4245",
];

export const PresetManager: React.FC<PresetManagerProps> = ({
  currentParams,
  onApply,
  disabled = false,
}) => {
  const isPresetActive = (preset: VoiceModPreset) =>
    JSON.stringify(preset.params) === JSON.stringify(currentParams);

  return (
    <View style={{ marginVertical: 8 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: "#b9bbbe",
          textTransform: "uppercase",
          letterSpacing: 1,
          paddingHorizontal: 16,
          marginBottom: 8,
        }}
      >
        Presets
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", paddingHorizontal: 12, gap: 6 }}>
          {PRESETS.map((preset, idx) => {
            const active = isPresetActive(preset);
            const color = presetColors[idx % presetColors.length];
            return (
              <TouchableOpacity
                key={idx}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: active ? color : "#2b2d31",
                  borderWidth: 1,
                  borderColor: active ? color : "#33363b",
                  marginBottom: 6,
                  minWidth: 80,
                  alignItems: "center",
                }}
                onPress={() => !disabled && onApply(preset.params)}
                disabled={disabled}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: active ? "700" : "500",
                    color: active ? "#fff" : "#b9bbbe",
                  }}
                >
                  {preset.name}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: "#2b2d31",
              borderWidth: 1,
              borderColor: "#ed4245",
              marginBottom: 6,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => !disabled && onApply(DEFAULT_PARAMS)}
            disabled={disabled}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "#ed4245",
              }}
            >
              Reset
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
