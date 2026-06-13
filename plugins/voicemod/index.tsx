import React from "react";
import { VoiceModSettings } from "./components/VoiceModSettings";

export default {
  name: "Xicor X Xenon Loud",
  version: "1.0.0",

  onStart() {
    console.log("[XicorXenonLoud] Plugin started");
  },

  onStop() {
    console.log("[XicorXenonLoud] Plugin stopped");
  },

  settings: VoiceModSettings,
};
