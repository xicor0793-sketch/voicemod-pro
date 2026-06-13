import React from "react";

const styles: Record<string, any> = {
  container: { flex: 1, backgroundColor: "#1e1f22", padding: 16 },
  header: { fontSize: 22, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 4 } as any,
  sub: { fontSize: 12, color: "#b9bbbe", textAlign: "center", marginBottom: 20, letterSpacing: 2, textTransform: "uppercase" } as any,
  card: { backgroundColor: "#2b2d31", borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#33363b" } as any,
  label: { fontSize: 13, color: "#dcddde", marginBottom: 6, fontWeight: "600" } as any,
  sliderTrack: { height: 6, backgroundColor: "#1e1f22", borderRadius: 3, borderWidth: 1, borderColor: "#33363b", overflow: "hidden" } as any,
  sliderFill: { height: "100%", backgroundColor: "#00b0f4", borderRadius: 3 } as any,
  value: { fontSize: 12, color: "#00b0f4", fontFamily: "monospace", textAlign: "right", marginTop: 2, fontWeight: "700" } as any,
};

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  set: (v: number) => void;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, unit, set }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return React.createElement("view", null,
    React.createElement("view", { style: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 } },
      React.createElement("text", { style: styles.label }, label),
      React.createElement("text", { style: styles.value }, `${value >= 0 ? "+" : ""}${value}${unit}`)
    ),
    React.createElement("view", { style: styles.sliderTrack },
      React.createElement("view", { style: [styles.sliderFill, { width: `${pct}%` }] })
    )
  );
};

export const VoiceModSettings: React.FC = () => {
  const [gain, setGain] = React.useState(0);
  const [pitch, setPitch] = React.useState(0);
  const [low, setLow] = React.useState(0);
  const [high, setHigh] = React.useState(0);
  const [mid, setMid] = React.useState(0);
  const [treble, setTreble] = React.useState(0);
  const [width, setWidth] = React.useState(0);
  const [pan, setPan] = React.useState(0);
  const [panSpeed, setPanSpeed] = React.useState(0);
  const [reverbSize, setReverbSize] = React.useState(30);
  const [reverbMix, setReverbMix] = React.useState(0);

  return React.createElement("scrollview", { style: styles.container },
    React.createElement("text", { style: styles.header }, "Xicor X Xenon Loud"),
    React.createElement("text", { style: styles.sub }, "Voice Modulation & EQ"),

    React.createElement("view", { style: styles.card },
      React.createElement(Slider, { label: "Gain", value: gain, min: -20, max: 20, step: 0.5, unit: "dB", set: setGain }),
    ),
    React.createElement("view", { style: styles.card },
      React.createElement(Slider, { label: "Pitch Shift", value: pitch, min: -12, max: 12, step: 1, unit: "st", set: setPitch }),
    ),
    React.createElement("view", { style: styles.card },
      React.createElement(Slider, { label: "Low Shelf", value: low, min: -12, max: 12, step: 0.5, unit: "dB", set: setLow }),
    ),
    React.createElement("view", { style: styles.card },
      React.createElement(Slider, { label: "Mid Peaking", value: mid, min: -12, max: 12, step: 0.5, unit: "dB", set: setMid }),
    ),
    React.createElement("view", { style: styles.card },
      React.createElement(Slider, { label: "High Shelf", value: high, min: -12, max: 12, step: 0.5, unit: "dB", set: setHigh }),
    ),
    React.createElement("view", { label: "view", style: styles.card },
      React.createElement(Slider, { label: "Treble / Drible", value: treble, min: -12, max: 12, step: 0.5, unit: "dB", set: setTreble }),
    ),
    React.createElement("view", { style: styles.card },
      React.createElement(Slider, { label: "Stereo Width", value: width, min: 0, max: 100, step: 1, unit: "%", set: setWidth }),
      React.createElement(Slider, { label: "Pan", value: pan, min: -100, max: 100, step: 1, unit: "", set: setPan }),
      React.createElement(Slider, { label: "Auto-Pan Speed", value: panSpeed, min: 0, max: 10, step: 0.1, unit: "Hz", set: setPanSpeed }),
    ),
    React.createElement("view", { style: styles.card },
      React.createElement(Slider, { label: "Reverb Size", value: reverbSize, min: 0, max: 100, step: 1, unit: "%", set: setReverbSize }),
      React.createElement(Slider, { label: "Reverb Mix", value: reverbMix, min: 0, max: 100, step: 1, unit: "%", set: setReverbMix }),
    ),
  );
};
