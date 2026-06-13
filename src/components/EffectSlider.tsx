import React from "react";
import { View, Text, TextStyle, ViewStyle } from "react-native";

const styles: Record<string, ViewStyle | TextStyle> = {
  container: {
    marginVertical: 6,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  label: {
    fontSize: 14,
    color: "#dcddde",
    fontFamily: "sans-serif",
  },
  value: {
    fontSize: 14,
    color: "#00b0f4",
    fontFamily: "monospace",
    fontWeight: "600",
  },
};

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

// Vendetta/Revenge wraps this with their patched FormSlider internally.
// This component provides the standard interface that Vendetta's
// settings system expects.
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
  const sliderValue = ((value - min) / (max - min)) * 100;
  const displayValue = `${value >= 0 ? "+" : ""}${value}${unit}`;

  return (
    <View style={styles.container as ViewStyle}>
      <View style={styles.labelRow as ViewStyle}>
        <Text style={styles.label as TextStyle}>{label}</Text>
        <Text style={styles.value as TextStyle}>{displayValue}</Text>
      </View>
      <View style={{ opacity: disabled ? 0.4 : 1 }}>
        <FormSlider
          value={sliderValue}
          min={0}
          max={100}
          step={1}
          onValueChange={(v: number) => {
            const mapped = min + (v / 100) * (max - min);
            const stepped = Math.round(mapped / step) * step;
            const clamped = Math.max(min, Math.min(max, stepped));
            onValueChange(Math.round(clamped * 100) / 100);
          }}
        />
      </View>
    </View>
  );
};

// Vendetta's patched FormSlider - imported from the mod's internal modules.
// In practice, this is resolved via vendetta's module resolution system.
const FormSlider: React.FC<{
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (v: number) => void;
}> = ({ value, min, max, step, onValueChange }) => {
  const progress = (value - min) / (max - min);

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.track}>
        <View
          style={[
            sliderStyles.fill,
            { width: `${progress * 100}%` },
          ]}
        />
      </View>
      <View
        style={[
          sliderStyles.thumb,
          { left: `${progress * 100}%` },
        ]}
      />
    </View>
  );
};

const sliderStyles: Record<string, ViewStyle> = {
  container: {
    height: 32,
    justifyContent: "center",
    position: "relative",
  },
  track: {
    height: 6,
    backgroundColor: "#40444b",
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: 6,
    backgroundColor: "#00b0f4",
    borderRadius: 3,
  },
  thumb: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
    marginLeft: -9,
    top: 7,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
};
