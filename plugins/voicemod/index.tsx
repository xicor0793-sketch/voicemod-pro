const { patcher } = vendetta;

const PARAMS = {
  masterGain: 100, inputBoost: 100, density: 100, voltage: 100,
  subBass: 100, presence: 100, width: 0, enabled: true,
};

let patches = [];
let debug = { found: [] };

function applyDSP(buf) {
  if (!buf || typeof buf.length !== "number" || buf.length === 0) return;
  const gain = 1 + ((PARAMS.masterGain / 100) * 10000);
  const boost = 1 + ((PARAMS.inputBoost / 100) * 100);
  const { density, voltage, subBass, presence, width } = PARAMS;
  const d = density / 100, v = voltage / 100, b = subBass / 100, p = presence / 100, w = width / 100;
  let last = 0;
  for (let i = 0; i < buf.length; i++) {
    let s = (buf[i] || 0) * boost;
    if (b > 0) s += s * b * 2;
    if (p > 0) s += (s - last) * p * 5;
    last = buf[i] || 0;
    s *= gain;
    if (d > 0) {
      const k = d * 100;
      s = (s * (1 + k)) / (1 + Math.abs(s * k));
      if (d > 0.8) s = s > 0.01 ? 1 : s < -0.01 ? -1 : s;
    }
    if (v > 0 && Math.abs(s) > 0.01) s += v;
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

function tryPatch(mod, fn, label) {
  if (mod && typeof mod[fn] === "function") {
    patches.push(patcher.before(mod, fn, (args) => {
      if (!PARAMS.enabled) return;
      for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a && typeof a.length === "number" && a.length > 0) {
          applyDSP(a);
        }
      }
    }));
    debug.found.push(label || fn);
    return true;
  }
  return false;
}

export default {
  name: "Bien Hyper-Sonic",
  onLoad() {
    try {
      const c = vendetta.metro.common;
      // Method 1: findByProps for specific method names
      const targets = [
        "encodeOpus", "decodeOpus", "processAudio", "processLocalAudio",
        "setLocalVolume", "onAudioData", "handleAudioData",
        "startCapture", "stopCapture",
      ];
      for (const t of targets) {
        try {
          const mod = c.findByProps(t);
          if (mod && tryPatch(mod, t)) { continue; }
        } catch(e) {}

        // Method 2: find any module where this is a method
        try {
          const mod = c.find(x => x && typeof x === "object" && typeof x[t] === "function");
          if (mod && tryPatch(mod, t)) { continue; }
        } catch(e) {}

        // Method 3: check nested objects
        try {
          const mod = c.find(x => x && typeof x === "object" && 
            Object.values(x).some(v => v && typeof v === "object" && typeof v[t] === "function"));
          if (mod) {
            for (const k of Object.keys(mod)) {
              if (mod[k] && typeof mod[k] === "object" && typeof mod[k][t] === "function") {
                tryPatch(mod[k], t, t + " (nested)");
              }
            }
          }
        } catch(e) {}
      }

      // Method 4: try native modules
      try {
        const nm = c.ReactNative?.NativeModules || {};
        for (const key of Object.keys(nm)) {
          if (key.toLowerCase().includes("voice") || key.toLowerCase().includes("audio") || key.toLowerCase().includes("opus")) {
            debug.found.push("NM:" + key);
          }
        }
      } catch(e) {}

      // Method 5: find VoiceConnection class
      try {
        const vc = c.findByProps("VoiceConnection");
        if (vc?.VoiceConnection?.prototype) {
          for (const m of Object.getOwnPropertyNames(vc.VoiceConnection.prototype)) {
            if (m !== "constructor") debug.found.push("VC:" + m);
          }
        }
      } catch(e) {}
    } catch (e) { console.error("[BHS]", e); }
    console.log("[BHS] Found modules:", debug.found.join(", ") || "NONE");
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
      const status = patches.length > 0 ? "ACTIVE (" + patches.length + " hooks)" : "NO MODULES";
      const foundStr = debug.found.length > 0 ? debug.found.join(", ") : "none";

      const params = [
        { k: "masterGain", l: "Master Gain", f: v => Math.round(1 + v/100*10000) + "x" },
        { k: "inputBoost", l: "Input Boost", f: v => Math.round(1 + v/100*100) + "x" },
        { k: "density", l: "Density", f: v => v + "%" },
        { k: "voltage", l: "Voltage", f: v => v + "%" },
        { k: "subBass", l: "Rumble", f: v => v + "%" },
        { k: "presence", l: "Pain", f: v => v + "%" },
        { k: "width", l: "Width", f: v => v + "%" },
      ];

      const rows = [
        R.createElement(FormRow, {
          key: "hdr", label: "Bien Hyper-Sonic",
          subLabel: status,
          trailing: FormSwitch ? R.createElement(FormSwitch, {
            value: PARAMS.enabled,
            onValueChange: v => { PARAMS.enabled = v; force(); }
          }) : null
        }),
        R.createElement(FormRow, {
          key: "debug", label: "Found:", subLabel: foundStr
        }),
      ];
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
