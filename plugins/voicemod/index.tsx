const { patcher } = vendetta;

const PARAMS = {
  masterGain: 0, inputBoost: 0, density: 0, voltage: 0,
  subBass: 0, presence: 0, width: 0, gate: -60, enabled: true,
};

let audioPatches = [];
let SettingsComponent = null;

function applyDSP(buffer) {
  const gain = 1 + (PARAMS.masterGain * 10000);
  const boost = 1 + (PARAMS.inputBoost * 100);
  const { density, voltage, subBass, presence, width } = PARAMS;
  let last = 0;
  for (let i = 0; i < buffer.length; i++) {
    let s = buffer[i]; s *= boost;
    if (subBass > 0) s += s * subBass * 2;
    if (presence > 0) { const h = (s - last) * presence * 5; s += h; }
    last = buffer[i]; s *= gain;
    if (density > 0) {
      const k = density * 100; s = (s * (1 + k)) / (1 + Math.abs(s * k));
      if (density > 0.8) { s = s > 0.01 ? 1 : s < -0.01 ? -1 : s; }
    }
    if (voltage > 0 && Math.abs(s) > 0.01) s += voltage;
    s = s > 0.99 ? 0.99 : s < -0.99 ? -0.99 : s;
    buffer[i] = s;
  }
  if (width > 0) {
    for (let i = 0; i < buffer.length; i += 2) {
      const w = 1 + width; buffer[i] *= w;
      if (i + 1 < buffer.length) buffer[i + 1] *= w * -1;
    }
  }
}

function buildSettings() {
  try {
    const m = vendetta.metro.common;
    const View = m.findByProps?.("View")?.View || m.View;
    const Text = m.findByProps?.("Text")?.Text || m.Text;
    const ScrollView = m.findByProps?.("ScrollView")?.ScrollView || m.ScrollView || View;
    const R = window.React;

    if (!View || !R) return null;

    const controls = [
      { key: "masterGain", label: "MASTER GAIN", color: "#00ffff", fmt: (v) => (1 + v * 10000).toFixed(0) + "x" },
      { key: "inputBoost", label: "INPUT BOOST", color: "#00aaff", fmt: (v) => (1 + v * 100).toFixed(0) + "x" },
      { key: "density", label: "DENSITY", color: "#ff0055", fmt: (v) => (v * 100).toFixed(0) + "%" },
      { key: "voltage", label: "VOLTAGE", color: "#ff0055", fmt: (v) => (v * 100).toFixed(0) + "%" },
      { key: "presence", label: "PAIN", color: "#ffff00", fmt: (v) => (v * 100).toFixed(0) + "%" },
      { key: "subBass", label: "RUMBLE", color: "#ffff00", fmt: (v) => (v * 100).toFixed(0) + "%" },
      { key: "width", label: "WIDER", color: "#ffffff", fmt: (v) => (v * 100).toFixed(0) + "%" },
    ];

    SettingsComponent = () => {
      const { useState, useCallback } = window.React;
      const [params, setParams] = useState({ ...PARAMS });

      const update = useCallback((key, delta) => {
        const newVal = Math.max(0, Math.min(100, (params[key] || 0) + delta));
        PARAMS[key] = newVal / 100;
        setParams(prev => ({ ...prev, [key]: newVal }));
      }, [params]);

      const toggle = useCallback(() => {
        PARAMS.enabled = !params.enabled;
        setParams(prev => ({ ...prev, enabled: !prev.enabled }));
      }, [params]);

      const barStyle = { height: 4, borderRadius: 2, marginTop: 4, overflow: "hidden", backgroundColor: "#1a1a1a" };
      const fillStyle = (pct, color) => ({ height: "100%", width: pct + "%", backgroundColor: color, borderRadius: 2 });

      return R.createElement(ScrollView, { style: { flex: 1, backgroundColor: "#0d0d0d", padding: 16 } },
        R.createElement(View, { style: { alignItems: "center", marginBottom: 16 } },
          R.createElement(Text, { style: { fontSize: 20, fontWeight: "800", color: "#00ffff", letterSpacing: 2 } }, "BIEN HYPER-SONIC"),
          R.createElement(Text, { style: { fontSize: 10, color: "#444", marginTop: 2, letterSpacing: 3, textTransform: "uppercase" } }, "PC Destroyer"),
        ),

        R.createElement(View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 } },
          R.createElement(View, { style: { width: 8, height: 8, borderRadius: 4, backgroundColor: params.enabled ? "#00ffff" : "#333", marginRight: 6 } }),
          R.createElement(Text, { style: { fontSize: 12, color: "#888", fontWeight: "700" } }, params.enabled ? "ENGAGED" : "BYPASSED"),
        ),

        R.createElement(View, { style: { marginBottom: 16, borderRadius: 8, backgroundColor: "#1a1a1a", padding: 12 } },
          R.createElement(Text, { style: { color: "#00ffff", fontSize: 10, fontWeight: "700", letterSpacing: 1 } }, "POWER"),
          R.createElement(View, { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 } },
            R.createElement(Text, { style: { color: "#00ffff", fontSize: 12, fontWeight: "600" } }, "MASTER GAIN"),
            R.createElement(Text, { style: { color: "#00ffff", fontSize: 12, fontFamily: "monospace" } }, (1 + (params.masterGain || 0) / 100 * 10000).toFixed(0) + "x"),
          ),
          R.createElement(View, { style: barStyle },
            R.createElement(View, { style: fillStyle(params.masterGain || 0, "#00ffff") }),
          ),
          R.createElement(View, { style: { flexDirection: "row", justifyContent: "center", marginTop: 6, gap: 12 } },
            R.createElement(Text, { style: { color: "#00ffff", fontSize: 18, fontWeight: "700", paddingHorizontal: 16, paddingVertical: 4 }, onPress: () => update("masterGain", -5) }, "-"),
            R.createElement(Text, { style: { color: "#00ffff", fontSize: 18, fontWeight: "700", paddingHorizontal: 16, paddingVertical: 4 }, onPress: () => update("masterGain", 5) }, "+"),
          ),
        ),

        R.createElement(View, { style: { marginBottom: 16, borderRadius: 8, backgroundColor: "#1a1a1a", padding: 12 } },
          R.createElement(Text, { style: { color: "#ff0055", fontSize: 10, fontWeight: "700", letterSpacing: 1 } }, "DESTRUCTION"),
          ...["density", "voltage"].map(k => R.createElement(View, { key: k },
            R.createElement(View, { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 } },
              R.createElement(Text, { style: { color: "#ff0055", fontSize: 12, fontWeight: "600" } }, k === "density" ? "DENSITY" : "VOLTAGE"),
              R.createElement(Text, { style: { color: "#ff0055", fontSize: 12, fontFamily: "monospace" } }, ((params[k] || 0)).toFixed(0) + "%"),
            ),
            R.createElement(View, { style: barStyle },
              R.createElement(View, { style: fillStyle(params[k] || 0, "#ff0055") }),
            ),
            R.createElement(View, { style: { flexDirection: "row", justifyContent: "center", marginTop: 6, gap: 12 } },
              R.createElement(Text, { style: { color: "#ff0055", fontSize: 18, fontWeight: "700", paddingHorizontal: 16, paddingVertical: 4 }, onPress: () => update(k, -5) }, "-"),
              R.createElement(Text, { style: { color: "#ff0055", fontSize: 18, fontWeight: "700", paddingHorizontal: 16, paddingVertical: 4 }, onPress: () => update(k, 5) }, "+"),
            ),
          )),
        ),

        R.createElement(View, { style: { marginBottom: 16, borderRadius: 8, backgroundColor: "#1a1a1a", padding: 12 } },
          R.createElement(Text, { style: { color: "#ffff00", fontSize: 10, fontWeight: "700", letterSpacing: 1 } }, "FREQUENCY ATTACK"),
          ...["presence", "subBass"].map(k => R.createElement(View, { key: k },
            R.createElement(View, { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 } },
              R.createElement(Text, { style: { color: "#ffff00", fontSize: 12, fontWeight: "600" } }, k === "presence" ? "PAIN (3kHz)" : "RUMBLE (Sub)"),
              R.createElement(Text, { style: { color: "#ffff00", fontSize: 12, fontFamily: "monospace" } }, ((params[k] || 0)).toFixed(0) + "%"),
            ),
            R.createElement(View, { style: barStyle },
              R.createElement(View, { style: fillStyle(params[k] || 0, "#ffff00") }),
            ),
            R.createElement(View, { style: { flexDirection: "row", justifyContent: "center", marginTop: 6, gap: 12 } },
              R.createElement(Text, { style: { color: "#ffff00", fontSize: 18, fontWeight: "700", paddingHorizontal: 16, paddingVertical: 4 }, onPress: () => update(k, -5) }, "-"),
              R.createElement(Text, { style: { color: "#ffff00", fontSize: 18, fontWeight: "700", paddingHorizontal: 16, paddingVertical: 4 }, onPress: () => update(k, 5) }, "+"),
            ),
          )),
        ),

        R.createElement(View, { style: { marginBottom: 16, borderRadius: 8, backgroundColor: "#1a1a1a", padding: 12 } },
          R.createElement(Text, { style: { color: "#ffffff", fontSize: 10, fontWeight: "700", letterSpacing: 1 } }, "SPACE"),
          R.createElement(View, { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 } },
            R.createElement(Text, { style: { color: "#ffffff", fontSize: 12, fontWeight: "600" } }, "WIDER"),
            R.createElement(Text, { style: { color: "#ffffff", fontSize: 12, fontFamily: "monospace" } }, ((params.width || 0)).toFixed(0) + "%"),
          ),
          R.createElement(View, { style: barStyle },
            R.createElement(View, { style: fillStyle(params.width || 0, "#ffffff") }),
          ),
          R.createElement(View, { style: { flexDirection: "row", justifyContent: "center", marginTop: 6, gap: 12 } },
            R.createElement(Text, { style: { color: "#ffffff", fontSize: 18, fontWeight: "700", paddingHorizontal: 16, paddingVertical: 4 }, onPress: () => update("width", -5) }, "-"),
            R.createElement(Text, { style: { color: "#ffffff", fontSize: 18, fontWeight: "700", paddingHorizontal: 16, paddingVertical: 4 }, onPress: () => update("width", 5) }, "+"),
          ),
        ),

        R.createElement(View, { style: { borderRadius: 8, backgroundColor: "#1a1a1a", padding: 12, marginBottom: 16 } },
          R.createElement(Text, { style: { color: "#555", fontSize: 9, textAlign: "center", fontFamily: "monospace" } }, "v77.0 | BIEN HYPER-SONIC"),
        ),
      );
    };
    return true;
  } catch (e) {
    console.error("[BHS] Settings build error:", e);
    return false;
  }
}

export default {
  name: "Bien Hyper-Sonic",
  onLoad() {
    console.log("[BHS] Loaded");
    buildSettings();
    try {
      const mods = vendetta.metro.common.findByProps("encodeOpus", "encode");
      if (mods?.encodeOpus) {
        audioPatches.push(patcher.before(mods, "encodeOpus", (args) => {
          if (PARAMS.enabled && args[0] instanceof Float32Array) applyDSP(args[0]);
        }));
      } else {
        const vp = vendetta.metro.common.findByProps("setLocalVolume");
        if (vp) {
          audioPatches.push(patcher.before(vp, "setLocalVolume", (args) => {
            if (PARAMS.enabled && args[0]?.buffer) applyDSP(args[0].buffer);
          }));
        }
      }
    } catch (e) { console.error("[BHS] Patch:", e); }
  },
  onUnload() {
    for (const p of audioPatches) try { p(); } catch {}
    audioPatches = [];
    console.log("[BHS] Unloaded");
  },
  get settings() {
    return SettingsComponent;
  },
};
