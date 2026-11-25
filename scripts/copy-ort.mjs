#!/usr/bin/env node
// Copy ONNX Runtime's WebAssembly files from node_modules into public/ort/ so the site never loads them
// from a CDN. Runs before `dev` and `build`; public/ort/ is git-ignored.
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "node_modules", "onnxruntime-web", "dist");
const OUT = join(ROOT, "public", "ort");
// The same two builds transformers.js chooses between (asyncify; plain for older Safari without WebGPU).
const FILES = [
  "ort-wasm-simd-threaded.asyncify.wasm",
  "ort-wasm-simd-threaded.asyncify.mjs",
  "ort-wasm-simd-threaded.wasm",
  "ort-wasm-simd-threaded.mjs",
];
mkdirSync(OUT, { recursive: true });
for (const f of FILES) {
  const from = join(SRC, f);
  if (!existsSync(from)) throw new Error(`missing ${from}; is onnxruntime-web installed?`);
  const to = join(OUT, f);
  if (existsSync(to) && statSync(to).size === statSync(from).size) continue;
  copyFileSync(from, to);
}
console.log(`ONNX Runtime wasm ready in public/ort/ (${FILES.length} files)`);
