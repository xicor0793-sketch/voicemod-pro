const { patcher } = vendetta;

const PARAMS = {
  masterGain: 100, inputBoost: 100, density: 100, voltage: 100,
  subBass: 100, presence: 100, width: 0, enabled: true,
};

let patches = [];
let fluxUnsub = null;
const patched = new Set();

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

function dspWrapper(args) {
  if (!PARAMS.enabled) return;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a && typeof a === "object" && typeof a.length === "number" && a.length > 0) {
      applyDSP(a);
    }
  }
}

function tryFindAndPatch() {
  const c = vendetta.metro.common;
  for (const name of ["encodeOpus", "decodeOpus", "processAudio", "setLocalVolume"]) {
    try {
      const mod = c.findByProps(name);
      if (mod && typeof mod[name] === "function" && !patched.has(mod[name])) {
        patched.add(mod[name]);
        patches.push(patcher.before(mod, name, dspWrapper));
      }
    } catch(e) {}
  }
}

export default {
  name: "Bien Hyper-Sonic",
  onLoad() {
    tryFindAndPatch();
    // Keep trying when voice state changes (modules load lazily)
    try {
      const Flux = vendetta.metro.common.findByProps("dispatch", "subscribe");
      if (Flux?.subscribe) {
        fluxUnsub = Flux.subscribe("VOICE_STATE_UPDATES", tryFindAndPatch);
      }
    } catch(e) {}
  },
  onUnload() {
    patches.forEach(p => p());
    patches = [];
    patched.clear();
    if (fluxUnsub) fluxUnsub();
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
      const status = patches.length > 0 ? "Hooked " + patches.length + " fn" : "Waiting for VC...";

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
