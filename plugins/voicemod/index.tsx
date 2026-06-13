const { patcher } = vendetta;

const PARAMS = {
  masterGain: 100, inputBoost: 100, density: 100, voltage: 100,
  subBass: 100, presence: 100, width: 0, enabled: true,
};

let patches = [];
let unsubs = [];
let foundStr = "searching";

function applyDSP(buf) {
  if (!buf || typeof buf.length !== "number" || buf.length < 2) return;
  const gain = 1 + ((PARAMS.masterGain / 100) * 10000);
  const boost = 1 + ((PARAMS.inputBoost / 100) * 100);
  const { density, voltage, subBass, presence, width } = PARAMS;
  const d = density / 100, v = voltage / 100, b = subBass / 100, p = presence / 100, w = width / 100;
  let last = 0;
  for (let i = 0; i < buf.length; i++) {
    const sample = buf[i] || 0;
    let s = sample * boost;
    if (b > 0) s += s * b * 2;
    if (p > 0) s += (s - last) * p * 5;
    last = sample;
    s *= gain;
    if (d > 0) {
      const k = d * 100;
      s = (s * (1 + k)) / (1 + Math.abs(s * k));
      if (d > 0.8) s = s > 0.01 ? 1 : s < -0.01 ? -1 : s;
    }
    if (v > 0 && Math.abs(s) > 0.01) s += v;
    buf[i] = s > 0.99 ? 0.99 : s < -0.99 ? -0.99 : s;
  }
  if (w > 0) {
    for (let i = 0; i < buf.length; i += 2) {
      const m = 1 + w;
      buf[i] *= m;
      if (i + 1 < buf.length) buf[i + 1] *= m * -1;
    }
  }
}

function hunt() {
  const found = [];
  const c = vendetta.metro.common;
  const targets = ["encodeOpus","decodeOpus","processAudio","setLocalVolume",
    "startCapture","stopCapture","onAudioData","processLocalAudio"];

  for (const t of targets) {
    try {
      const m = c.findByProps(t);
      if (m && typeof m[t] === "function") {
        patches.push(patcher.before(m, t, (args) => {
          if (!PARAMS.enabled) return;
          for (let i = 0; i < args.length; i++) {
            const a = args[i];
            if (a && typeof a.length === "number" && a.length > 0) applyDSP(a);
          }
        }));
        found.push(t);
      }
    } catch(e) {}
  }

  try {
    const nm = c.ReactNative?.NativeModules || {};
    for (const k of Object.keys(nm)) {
      const kl = k.toLowerCase();
      if (kl.includes("voice") || kl.includes("audio") || kl.includes("opus")) {
        found.push("NM:" + k);
      }
    }
  } catch(e) {}

  try {
    const vc = c.findByProps("VoiceConnection");
    if (vc?.VoiceConnection?.prototype) {
      const methods = Object.getOwnPropertyNames(vc.VoiceConnection.prototype).filter(x => x !== "constructor");
      if (methods.length > 0) found.push("VC:" + methods.join(","));
    }
  } catch(e) {}

  // Try to find by function toString content
  try {
    for (const mod of Object.values(c)) {
      if (!mod || typeof mod !== "object") continue;
      for (const key of Object.keys(mod)) {
        const v = mod[key];
        if (typeof v === "function") {
          const s = v.toString();
          if ((s.includes("encodeOpus") || s.includes("applyEncoder")) && s.length < 500) {
            patches.push(patcher.before(mod, key, (args) => {
              if (!PARAMS.enabled) return;
              for (let i = 0; i < args.length; i++) {
                const a = args[i];
                if (a && typeof a.length === "number" && a.length > 0) applyDSP(a);
              }
            }));
            found.push("fn:" + (v.name || key));
          }
        }
      }
    }
  } catch(e) {}

  foundStr = found.length > 0 ? found.join(", ") : "none found";
  console.log("[BHS] hunt found:", foundStr);
}

export default {
  name: "Bien Hyper-Sonic",
  onLoad() {
    hunt();
    try {
      const Flux = vendetta.metro.common.findByProps("dispatch", "subscribe");
      if (Flux?.subscribe) {
        unsubs.push(Flux.subscribe("VOICE_STATE_UPDATES", hunt));
        unsubs.push(Flux.subscribe("AUDIO_TOGGLE", hunt));
      }
    } catch(e) {}
  },
  onUnload() {
    patches.forEach(p => p());
    patches = [];
    unsubs.forEach(u => u());
    unsubs = [];
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
      const status = patches.length > 0 ? "Hooked " + patches.length + " functions" : "No hooks installed";
      const steps = [0,10,20,30,40,50,60,70,80,90,100];

      const params = [
        { k: "masterGain", l: "Gain", f: v => Math.round(1 + v/100*10000) + "x" },
        { k: "inputBoost", l: "Boost", f: v => Math.round(1 + v/100*100) + "x" },
        { k: "density", l: "Clip", f: v => v + "%" },
        { k: "voltage", l: "DC", f: v => v + "%" },
        { k: "subBass", l: "Rumble", f: v => v + "%" },
        { k: "presence", l: "Pain", f: v => v + "%" },
        { k: "width", l: "Widen", f: v => v + "%" },
      ];

      const rows = [
        R.createElement(FormRow, { key: "hdr", label: "Bien Hyper-Sonic",
          subLabel: status,
          trailing: FormSwitch ? R.createElement(FormSwitch, {
            value: PARAMS.enabled,
            onValueChange: v => { PARAMS.enabled = v; force(); }
          }) : null
        }),
        R.createElement(FormRow, { key: "found", label: "Found:", subLabel: foundStr }),
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
    } catch (e) { return null; }
  },
};
