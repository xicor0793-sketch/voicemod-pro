const { patcher } = vendetta;

const PARAMS = {
  masterGain: 100, inputBoost: 100, density: 100, voltage: 100,
  subBass: 100, presence: 100, width: 0, enabled: true,
};

let patches = [];

function applyDSP(buf) {
  if (!buf || typeof buf.length !== "number") return;
  const gain = 1 + ((PARAMS.masterGain / 100) * 10000);
  const boost = 1 + ((PARAMS.inputBoost / 100) * 100);
  const { density, voltage, subBass, presence, width } = PARAMS;
  const d = density / 100, v = voltage / 100, b = subBass / 100, p = presence / 100, w = width / 100;
  let last = 0;
  for (let i = 0; i < buf.length; i++) {
    let s = buf[i] * boost;
    if (b > 0) s += s * b * 2;
    if (p > 0) s += (s - last) * p * 5;
    last = buf[i];
    s *= gain;
    if (d > 0) {
      const k = d * 100;
      s = (s * (1 + k)) / (1 + Math.abs(s * k));
      if (d > 0.8) s = s > 0.01 ? 1 : s < -0.01 ? -1 : s;
    }
    if (v > 0 && Math.abs(s) > 0.01) s += v;
    s = s > 0.99 ? 0.99 : s < -0.99 ? -0.99 : s;
    buf[i] = s;
  }
  if (w > 0) {
    for (let i = 0; i < buf.length; i += 2) {
      const m = 1 + w;
      buf[i] *= m;
      if (i + 1 < buf.length) buf[i + 1] *= m * -1;
    }
  }
}

function tryPatch(mod, fn) {
  if (mod && typeof mod[fn] === "function") {
    patches.push(patcher.before(mod, fn, (args) => {
      if (!PARAMS.enabled) return;
      for (let i = 0; i < args.length; i++) {
        if (args[i] && typeof args[i].length === "number") {
          applyDSP(args[i]);
        }
      }
    }));
    return true;
  }
  return false;
}

export default {
  name: "Bien Hyper-Sonic",
  onLoad() {
    try {
      const c = vendetta.metro.common;
      const names = [
        "encodeOpus", "decodeOpus", "processAudio", "processLocalAudio",
        "setLocalVolume", "setLocalAudioDevice", "startCapture", "stopCapture",
        "onAudioData", "handleAudioData", "processVoiceData", "sendVoiceData",
      ];
      for (const name of names) {
        try {
          const mod = c.findByProps(name);
          if (mod && tryPatch(mod, name)) console.log("[BHS] Patched:", name);
          const mod2 = c.find(x => x && typeof x === "object" && Object.values(x).some(v => typeof v === "function" && (v.name === name || v.displayName === name)));
          if (mod2) {
            for (const key of Object.keys(mod2)) {
              if (typeof mod2[key] === "function" && key === name && tryPatch(mod2, key)) {
                console.log("[BHS] Patched (find):", name);
              }
            }
          }
        } catch (e) {}
      }
    } catch (e) { console.error("[BHS]", e); }
  },
  onUnload() {
    patches.forEach(p => p());
    patches = [];
  },
  settings: () => {
    try {
      const R = vendetta.metro.common.React;
      if (!R?.createElement) return null;
      const RN = vendetta.metro.common.ReactNative;
      if (!RN?.View) return null;
      const C = vendetta.ui?.components?.Forms || vendetta.ui?.components;
      const FormRow = C?.FormRow, FormSwitch = C?.FormSwitch;
      if (!FormRow) return null;

      const [, f] = R.useState(0);
      const force = () => f(x => x + 1);
      const steps = [0,10,20,30,40,50,60,70,80,90,100];

      const params = [
        { k: "masterGain", l: "Master Gain", f: v => Math.round(1 + v/100*10000) + "x" },
        { k: "inputBoost", l: "Input Boost", f: v => Math.round(1 + v/100*100) + "x" },
        { k: "density", l: "Density", f: v => v + "%" },
        { k: "voltage", l: "Voltage", f: v => v + "%" },
        { k: "subBass", l: "Rumble", f: v => v + "%" },
        { k: "presence", l: "Pain", f: v => v + "%" },
        { k: "width", l: "Width", f: v => v + "%" },
      ];

      const header = R.createElement(FormRow, {
        key: "hdr", label: "Bien Hyper-Sonic",
        subLabel: PARAMS.enabled ? "Active" : "Bypassed",
        trailing: FormSwitch ? R.createElement(FormSwitch, {
          value: PARAMS.enabled,
          onValueChange: v => { PARAMS.enabled = v; force(); }
        }) : null
      });

      const rows = [header];
      for (const p of params) {
        rows.push(R.createElement(FormRow, {
          key: p.k, label: p.l,
          subLabel: p.f(PARAMS[p.k]),
          onPress: () => {
            PARAMS[p.k] = steps[(steps.indexOf(PARAMS[p.k]) + 1) % steps.length];
            force();
          }
        }));
      }

      return R.createElement(RN.ScrollView, { style: { flex: 1 }, children: R.createElement(RN.View, { style: { marginTop: 16 }, children: rows }) });
    } catch (e) { console.log("[BHS] Settings error:", e?.message); return null; }
  },
};
