import { readFile, writeFile, readdir, mkdir, cp } from "fs/promises";
import { join, dirname } from "path";
import { createHash } from "crypto";
import { fileURLToPath } from "url";
import { build } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));

const vendettaPlugin = {
  name: "vendetta-globals",
  setup(build) {
    // Redirect react/react-native to globals
    build.onResolve({ filter: /^react$/ }, () => {
      return { path: "react", namespace: "vm-globals" };
    });
    build.onResolve({ filter: /^react-native$/ }, () => {
      return { path: "react-native", namespace: "vm-globals" };
    });
    build.onLoad({ filter: /.*/, namespace: "vm-globals" }, (args) => {
      if (args.path === "react") {
        return {
          contents: `
            export default window.React;
            export const createElement = window.React.createElement;
            export const Component = window.React.Component;
            export const useState = window.React.useState;
            export const useCallback = window.React.useCallback;
            export const useEffect = window.React.useEffect;
            export const useRef = window.React.useRef;
            export const useMemo = window.React.useMemo;
            export const memo = window.React.memo;
            export const Fragment = window.React.Fragment;
          `,
          loader: "js",
        };
      }
      if (args.path === "react-native") {
        return {
          contents: `
            const rn = window.ReactNative;
            export const { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Platform } = rn;
            export default rn;
          `,
          loader: "js",
        };
      }
    });
  },
};

async function buildPlugin(plugDir) {
  const manifestPath = join(plugDir, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  if (!manifest.main) {
    console.error(`No "main" field in ${manifestPath}`);
    return;
  }

  const entryPath = join(plugDir, manifest.main);
  const pluginName = manifest.name.toLowerCase().replace(/\s+/g, "-");
  const outDir = join(__dirname, "dist", pluginName);
  const outPath = join(outDir, "index.js");

  await mkdir(outDir, { recursive: true });

  await build({
    entryPoints: [entryPath],
    bundle: true,
    format: "iife",
    globalName: "plugin",
    outfile: outPath,
    minify: true,
    plugins: [vendettaPlugin],
    banner: {
      js: "(()=>{",
    },
    footer: {
      js: "\nreturn plugin;})();",
    },
  });

  const toHash = await readFile(outPath);
  manifest.hash = createHash("sha256").update(toHash).digest("hex");
  manifest.main = "index.js";
  await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`Built ${manifest.name} (${outPath})`);
}

async function copyNativeSource() {
  const src = join(__dirname, "native");
  const dst = join(__dirname, "dist", "native-source");
  try {
    await cp(src, dst, { recursive: true });
    console.log("Copied native C++ source to dist/native-source");
  } catch {}
}

async function main() {
  const pluginsDir = join(__dirname, "plugins");
  try {
    const entries = await readdir(pluginsDir, { withFileTypes: true });
    const pluginDirs = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => join(pluginsDir, e.name));

    if (pluginDirs.length === 0) {
      console.error("No plugin directories found in ./plugins/");
      process.exit(1);
    }

    for (const dir of pluginDirs) {
      await buildPlugin(dir);
    }

    await copyNativeSource();

    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xicor X Xenon Loud - Revenge Plugin</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #1e1f22; color: #dcddde; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #00b0f4; }
    code { background: #2b2d31; padding: 2px 6px; border-radius: 4px; }
    .url { background: #2b2d31; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 16px; color: #00b0f4; word-break: break-all; margin: 16px 0; }
    .footer { margin-top: 40px; color: #6d6f78; font-size: 13px; }
  </style>
</head>
<body>
  <h1>Xicor X Xenon Loud</h1>
  <p>Real-time Voice Modulation & Equalization plugin for Revenge Discord mod.</p>
  <p>Install by pasting this URL into <strong>Settings \u2192 Revenge \u2192 Plugins \u2192 Install Plugin</strong>:</p>
  <div class="url" id="installUrl">Loading...</div>
  <h2>Presets</h2>
  <ul>
    <li><strong>Default (Flat)</strong> \u2014 Neutral pass-through</li>
    <li><strong>Radio Voice</strong> \u2014 Broadcast-style voice</li>
    <li><strong>Deep Bass</strong> \u2014 Lowered pitch + bass boost</li>
    <li><strong>Chipmunk</strong> \u2014 High-pitch effect</li>
    <li><strong>Robotic</strong> \u2014 Narrow, mid-focused + auto-pan</li>
    <li><strong>Cathedral</strong> \u2014 Large reverb hall</li>
    <li><strong>Telephone</strong> \u2014 Narrow bandpass</li>
  </ul>
  <div class="footer"><p>Version 1.0.0</p></div>
  <script>var url = window.location.href.replace(/\\/?$/, '/xicor-x-xenon-loud/index.js'); document.getElementById('installUrl').textContent = url;</script>
</body>
</html>`;
    await writeFile(join(__dirname, "dist", "index.html"), indexHtml);
    console.log("Generated index.html");
    console.log("Build complete!");
  } catch (e) {
    console.error("Build failed:", e);
    process.exit(1);
  }
}

main();
