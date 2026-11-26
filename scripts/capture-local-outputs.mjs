#!/usr/bin/env node
// Runs every "Run it locally" listing for Module 01 in a clean python:3.12-slim container with pinned
// packages and saves its real output next to the code, so the page never shows an output nobody ran.
//   OLLAMA_URL=http://<host>:11434 node scripts/capture-local-outputs.mjs [id ...]
// Needs Docker; repgen also needs Ollama with gemma4:12b. Hugging Face models are cached in .cache/hf.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DIR = "src/subjects/01-intro-llms/deep/local";
const OUT = "src/subjects/01-intro-llms/deep/local-outputs.json";
const IMAGE = "python:3.12-slim";
/** Exact versions; the page shows this same install line. */
export const PACKAGES = { torch: "2.15.0", transformers: "5.22.2", "sentence-transformers": "6.2.0", sentencepiece: "0.2.3" };
const IDS = ["dense", "context", "encdec", "repgen"];

const only = process.argv.slice(2);
const ids = only.length ? only : IDS;
const ollama = process.env.OLLAMA_URL;
if (ids.includes("repgen") && !ollama) throw new Error("set OLLAMA_URL (e.g. http://172.30.208.1:11434) to capture repgen");

const cache = resolve(ROOT, ".cache/hf");
mkdirSync(cache, { recursive: true });
const out = existsSync(resolve(ROOT, OUT)) ? JSON.parse(readFileSync(resolve(ROOT, OUT), "utf8")) : {};

const pins = Object.entries(PACKAGES).map(([p, v]) => `${p}==${v}`).join(" ");
const script = [
  "set -e",
  // CPU wheels keep the download small; outputs are the same on any CPU.
  `pip install -q --root-user-action=ignore --index-url https://download.pytorch.org/whl/cpu torch==${PACKAGES.torch} >/dev/null`,
  `pip install -q --root-user-action=ignore ${pins} >/dev/null`,
  ...ids.map((id) => `echo "@@@ ${id}"; python -W ignore /listings/${id}.py 2>/dev/null`),
].join("\n");

const stdout = execFileSync(
  "docker",
  [
    "run", "--rm", "--network", "host",
    "-v", `${resolve(ROOT, DIR)}:/listings:ro`,
    "-v", `${cache}:/root/.cache/huggingface`,
    "-e", "HF_HUB_DISABLE_PROGRESS_BARS=1", "-e", "TRANSFORMERS_VERBOSITY=error", "-e", "TOKENIZERS_PARALLELISM=false",
    ...(ollama ? ["-e", `OLLAMA_URL=${ollama}`] : []),
    IMAGE, "bash", "-c", script,
  ],
  { encoding: "utf8", maxBuffer: 1 << 24, stdio: ["ignore", "pipe", "inherit"] },
);

const ranAt = new Date().toISOString().slice(0, 10);
for (const chunk of stdout.split("@@@ ").slice(1)) {
  const nl = chunk.indexOf("\n");
  const id = chunk.slice(0, nl).trim();
  const code = readFileSync(resolve(ROOT, DIR, `${id}.py`), "utf8");
  out[id] = { code, output: chunk.slice(nl + 1).replace(/\s+$/, ""), ranAt, image: IMAGE, packages: PACKAGES };
  console.log(`captured ${id}: ${out[id].output.split("\n").length} lines`);
}
writeFileSync(resolve(ROOT, OUT), JSON.stringify(out, null, 2) + "\n");
