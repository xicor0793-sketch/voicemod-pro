import React from "react";
import { View, Text, TextStyle, ViewStyle } from "react-native";

interface EffectSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onValueChange: (value: number) => void;
  disabled?: boolean;
}

export const EffectSlider: React.FC<EffectSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  onValueChange,
  disabled = false,
}) => {
  const progress = ((value - min) / (max - min)) * 100;
  const displayValue = `${value >= 0 ? "+" : ""}${value}${unit}`;
  const isCenter = min < 0 && max > 0;

  return (
    <View style={{ marginVertical: 6 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <Text style={{ fontSize: 13, color: "#dcddde", fontWeight: "500" }}>
          {label}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: "#00b0f4",
            fontFamily: "monospace",
            fontWeight: "700",
          }}
        >
          {displayValue}
        </Text>
      </View>
      <View style={{ opacity: disabled ? 0.35 : 1 }}>
        <View
          style={{
            height: 28,
            justifyContent: "center",
            position: "relative",
          }}
        >
          <View
            style={{
              height: 6,
              backgroundColor: "#1e1f22",
              borderRadius: 3,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "#33363b",
            }}
          >
            {isCenter && (
              <View
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 0,
                  bottom: 0,
                  width: 2,
                  backgroundColor: "#555",
                  marginLeft: -1,
                }}
              />
            )}
            <View
              style={{
                height: "100%",
                width: `${progress}%`,
                backgroundColor: disabled ? "#6d6f78" : "#00b0f4",
                borderRadius: 3,
              }}
            />
            <View
              style={{
                position: "absolute",
                left: `${progress}%`,
                top: -5,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: "#fff",
                marginLeft: -8,
                shadowColor: "#000",
                shadowOpacity: 0.4,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 2 },
                elevation: 4,
                borderWidth: 2,
                borderColor: disabled ? "#6d6f78" : "#00b0f4",
              }}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 2,
              paddingHorizontal: 2,
            }}
          >
            <Text style={{ fontSize: 9, color: "#6d6f78" }}>{min}</Text>
            <Text style={{ fontSize: 9, color: "#6d6f78" }}>{max}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};
