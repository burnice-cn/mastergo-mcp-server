import { mkdir, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = resolve(rootDir, "src");
const pluginDir = resolve(rootDir, "plugin");

await mkdir(pluginDir, { recursive: true });

await build({
  entryPoints: [resolve(srcDir, "plugin/index.ts")],
  outfile: resolve(pluginDir, "index.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2019",
  legalComments: "none",
});

await copyFile(resolve(srcDir, "manifest.json"), resolve(pluginDir, "manifest.json"));
