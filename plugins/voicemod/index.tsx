const { patcher } = vendetta;

const PARAMS = {
  masterGain: 50, inputBoost: 30, density: 0, voltage: 0,
  subBass: 20, presence: 30, width: 0, enabled: true,
};

let patches = [];

function applyDSP(buf) {
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
      const f = 1 + w;
      buf[i] *= f;
      if (i + 1 < buf.length) buf[i + 1] *= f * -1;
    }
  }
}

export default {
  name: "Bien Hyper-Sonic",
  onLoad() {
    try {
      const enc = vendetta.metro.common.findByProps("encodeOpus");
      if (enc?.encodeOpus) {
        patches.push(patcher.before(enc, "encodeOpus", ([buf]) => {
          if (PARAMS.enabled && buf instanceof Float32Array) applyDSP(buf);
        }));
        console.log("[BHS] Patched encodeOpus");
      } else {
        console.log("[BHS] encodeOpus not found");
      }
    } catch (e) { console.error("[BHS]", e); }
  },
  onUnload() {
    patches.forEach(p => p());
    patches = [];
  },
  settings: () => {
    try {
      const R = window.React?.createElement ? window.React : vendetta.metro.common.findByProps("createElement", "useState");
      if (!R?.createElement) {
        console.log("[BHS] Settings: React not found (window.React:", !!window.React, "metro.findByProps:", !!vendetta.metro.common.findByProps("createElement", "useState"), ")");
        return null;
      }
      const FormRow = vendetta.ui?.components?.FormRow;
      const FormSwitch = vendetta.ui?.components?.FormSwitch;
      if (!FormRow) {
        console.log("[BHS] Settings: FormRow not found (vendetta.ui:", !!vendetta.ui, "components:", !!vendetta.ui?.components, "keys:", vendetta.ui?.components ? Object.keys(vendetta.ui.components).join(",") : "none", ")");
        return null;
      }
      const [, f] = R.useState(0);
      const force = () => f(x => x + 1);
      const params = [
        { k: "masterGain", l: "Master Gain", fmt: v => Math.round(1 + v/100*10000) + "x" },
        { k: "inputBoost", l: "Input Boost", fmt: v => Math.round(1 + v/100*100) + "x" },
        { k: "density", l: "Density", fmt: v => v + "%" },
        { k: "voltage", l: "Voltage", fmt: v => v + "%" },
        { k: "subBass", l: "Rumble", fmt: v => v + "%" },
        { k: "presence", l: "Pain", fmt: v => v + "%" },
        { k: "width", l: "Width", fmt: v => v + "%" },
      ];
      const rows = [
        R.createElement(FormRow, {
          key: "hdr", label: "Bien Hyper-Sonic",
          subLabel: PARAMS.enabled ? "Active" : "Bypassed",
          trailing: R.createElement(FormSwitch, {
            value: PARAMS.enabled,
            onValueChange: v => { PARAMS.enabled = v; force(); }
          })
        }),
        ...params.map(p => R.createElement(FormRow, {
          key: p.k, label: p.l,
          subLabel: p.fmt(PARAMS[p.k]),
          onPress: () => {
            const steps = [0,10,20,30,40,50,60,70,80,90,100];
            PARAMS[p.k] = steps[(steps.indexOf(PARAMS[p.k]) + 1) % steps.length];
            force();
          }
        }))
      ];
      return R.createElement(R.Fragment, null, ...rows);
    } catch (e) {
      console.log("[BHS] Settings error:", e?.message, e?.stack?.slice?.(0, 200));
      return null;
    }
  },
};
