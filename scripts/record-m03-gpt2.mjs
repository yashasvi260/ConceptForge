#!/usr/bin/env node
// Runs scripts/record-m03-gpt2.py in python:3.12-slim with the same pinned torch/transformers as the
// "Run it locally" captures, and writes real GPT-2 internals to Module 03's data folder.
//   node scripts/record-m03-gpt2.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const TORCH = "2.15.0";
const TRANSFORMERS = "5.22.2";
const cache = resolve(ROOT, ".cache/hf");
mkdirSync(cache, { recursive: true });
const script = [
  "set -e",
  `pip install -q --root-user-action=ignore --index-url https://download.pytorch.org/whl/cpu torch==${TORCH} >/dev/null`,
  `pip install -q --root-user-action=ignore transformers==${TRANSFORMERS} >/dev/null`,
  "python -W ignore /scripts/record-m03-gpt2.py 2>/dev/null",
].join("\n");
const out = execFileSync(
  "docker",
  [
    "run", "--rm", "--network", "host",
    "-v", `${resolve(ROOT, "scripts")}:/scripts:ro`,
    "-v", `${cache}:/root/.cache/huggingface`,
    "-e", "HF_HUB_DISABLE_PROGRESS_BARS=1", "-e", "TRANSFORMERS_VERBOSITY=error",
    "python:3.12-slim", "bash", "-c", script,
  ],
  { encoding: "utf8", maxBuffer: 1 << 26, stdio: ["ignore", "pipe", "inherit"] },
);
const data = JSON.parse(out);
const dir = resolve(ROOT, "src/subjects/03-transformer-internals/data");
mkdirSync(dir, { recursive: true });
writeFileSync(resolve(dir, "gpt2.json"), JSON.stringify(data));
console.log(`wrote gpt2.json: ${data.sentences.length} sentences, ${data.config.layers}×${data.config.heads} heads (transformers ${data.transformers}, torch ${data.torch})`);
