import { readFile, writeFile, readdir, mkdir, cp } from "fs/promises";
import { extname, join, dirname } from "path";
import { createHash } from "crypto";
import { fileURLToPath } from "url";

import { rollup } from "rollup";
import esbuild from "rollup-plugin-esbuild";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";

const __dirname = dirname(fileURLToPath(import.meta.url));
const extensions = [".js", ".jsx", ".mjs", ".ts", ".tsx", ".cts", ".mts"];

// Modules provided by the runtime - don't bundle them
const externalModules = ["react", "react-native", ...["@vendetta", "@revenge"].flatMap((p) => [p, `${p}/*`])];

const plugins = [
  nodeResolve({ extensions, resolveOnly: (id) => !externalModules.some((e) => id === e || id.startsWith(e.endsWith("*") ? e.slice(0, -1) : e + "/")) }),
  commonjs({ exclude: ["node_modules/react-native/**", "node_modules/react/**"] }),
  esbuild({ minify: true }),
];

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

  await mkdir(outDir, { recursive: true });

  const outPath = join(outDir, "index.js");

  try {
    const bundle = await rollup({
      input: entryPath,
      onwarn: () => {},
      plugins,
      external: externalModules,
    });

    await bundle.write({
      file: outPath,
      globals(id) {
        if (id.startsWith("@vendetta")) return id.substring(1).replace(/\//g, ".");
        if (id.startsWith("@revenge")) return id.substring(1).replace(/\//g, ".");
        const map = {
          react: "window.React",
          "react-native": "window.ReactNative",
        };
        return map[id] || null;
      },
      format: "iife",
      compact: true,
      exports: "named",
    });
    await bundle.close();

    const toHash = await readFile(outPath);
    manifest.hash = createHash("sha256").update(toHash).digest("hex");
    manifest.main = "index.js";
    await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

    console.log(`Built ${manifest.name} (${outPath})`);
    return pluginName;
  } catch (e) {
    console.error(`Failed to build ${manifest.name}:`, e);
    throw e;
  }
}

// Copy native C++ source to dist for reference
async function copyNativeSource() {
  const src = join(__dirname, "native");
  const dst = join(__dirname, "dist", "native-source");
  try {
    await cp(src, dst, { recursive: true });
    console.log("Copied native C++ source to dist/native-source");
  } catch {
    // Native dir may not exist in all setups
  }
}

async function main() {
  const pluginsDir = join(__dirname, "plugins");

  try {
    const entries = await readdir(pluginsDir, { withFileTypes: true });
    const pluginDirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => join(pluginsDir, e.name));

    if (pluginDirs.length === 0) {
      console.error("No plugin directories found in ./plugins/");
      process.exit(1);
    }

    for (const dir of pluginDirs) {
      await buildPlugin(dir);
    }

    await copyNativeSource();

    // Generate index page for GitHub Pages
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
  <p>Install by pasting this URL into <strong>Settings → Revenge → Plugins → Install Plugin</strong>:</p>
  <div class="url" id="installUrl">Loading...</div>

  <h2>Presets</h2>
  <ul>
    <li><strong>Default (Flat)</strong> — Neutral pass-through</li>
    <li><strong>Radio Voice</strong> — Broadcast-style voice</li>
    <li><strong>Deep Bass</strong> — Lowered pitch + bass boost</li>
    <li><strong>Chipmunk</strong> — High-pitch effect</li>
    <li><strong>Robotic</strong> — Narrow, mid-focused + auto-pan</li>
    <li><strong>Cathedral</strong> — Large reverb hall</li>
    <li><strong>Telephone</strong> — Narrow bandpass</li>
  </ul>

  <h2>Native C++ Engine</h2>
  <p>Full DSP effects rack requires the native module to be compiled into the Revenge bundle. Source available in <code>dist/native-source/</code>.</p>

  <div class="footer">
    <p>Version 1.0.0</p>
  </div>

  <script>
    var url = window.location.href.replace(/\/?$/, '/xicor-x-xenon-loud/index.js');
    document.getElementById('installUrl').textContent = url;
  </script>
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
