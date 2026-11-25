#!/usr/bin/env node
// Download the all-MiniLM-L6-v2 browser model (Apache-2.0) into public/models/ so the site serves it itself.
//   node scripts/fetch-model.mjs
import { mkdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = "Xenova/all-MiniLM-L6-v2";
const BASE = `https://huggingface.co/${REPO}/resolve/main/`;
const FILES = { "config.json": null, "tokenizer.json": null, "tokenizer_config.json": null, "special_tokens_map.json": null, "onnx/model_quantized.onnx": 22_972_370 };

for (const [file, expectedSize] of Object.entries(FILES)) {
  const out = join(ROOT, "public", "models", REPO, file);
  if (existsSync(out) && (expectedSize === null || statSync(out).size === expectedSize)) {
    console.log(`ok   ${file}`);
    continue;
  }
  const res = await fetch(BASE + file);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (expectedSize !== null && buf.length !== expectedSize) throw new Error(`${file}: expected ${expectedSize} bytes, got ${buf.length}`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buf);
  console.log(`got  ${file} (${buf.length} bytes)`);
}
