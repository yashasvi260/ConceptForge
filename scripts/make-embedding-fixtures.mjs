#!/usr/bin/env node
// Precompute REAL all-MiniLM-L6-v2 outputs for the texts the UI tests use, so jsdom tests (where ONNX
// Runtime can't run) still see genuine numbers. Re-run after adding texts:
//   node scripts/make-embedding-fixtures.mjs
import { pipeline, env } from "@huggingface/transformers";
import { writeFileSync } from "node:fs";

env.allowRemoteModels = false;
env.localModelPath = `${process.cwd()}/public/models/`;
const pipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: "q8" });

// Dataset mode: real MiniLM vectors for every row of a JSON dataset, in order (4-decimal rounding).
//   node scripts/make-embedding-fixtures.mjs --dataset path.json [--field text] [--array items] --out path.json
const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : undefined; };
if (opt("dataset")) {
  const { readFileSync } = await import("node:fs");
  const raw = JSON.parse(readFileSync(opt("dataset"), "utf8"));
  const rows = opt("array") ? raw[opt("array")] : raw;
  const field = opt("field") ?? "text";
  const texts = rows.map((r) => r[field]);
  const out = [];
  for (let i = 0; i < texts.length; i += 16) {
    const batch = (await pipe(texts.slice(i, i + 16), { pooling: "mean", normalize: true })).tolist();
    out.push(...batch.map((v) => v.map((x) => Math.round(x * 1e4) / 1e4)));
  }
  writeFileSync(opt("out"), JSON.stringify({ model: "Xenova/all-MiniLM-L6-v2 q8", vectors: out }));
  console.log(`wrote ${out.length} vectors to ${opt("out")}`);
  process.exit(0);
}

const SENTENCES = [
  "The film was great", "The movie was excellent", "Interest rates rose today", "Dog bites man", "Man bites dog",
  "This is a positive review.", "This is a negative review.", "This movie was fantastic, I loved every minute!",
  "The bank approved the loan", "The river bank flooded", "I deposited cash at the bank", "We had a picnic on the river bank",
  "How do I reset my password?", "I forgot my login details", "What's the weather like tomorrow?", "Our quarterly revenue grew by 12%",
  "I can't sign in to my account",
];
const TOKEN_TEXTS = ["The bank approved the loan", "The river bank flooded", "I deposited cash at the bank", "We had a picnic on the river bank", "bank"];

const round = (v) => v.map((x) => Math.round(x * 1e6) / 1e6);
const sentences = {};
const vecs = (await pipe(SENTENCES, { pooling: "mean", normalize: true })).tolist();
SENTENCES.forEach((s, i) => (sentences[s] = round(vecs[i])));
const tokens = {};
for (const t of TOKEN_TEXTS) {
  const rows = (await pipe(t, { pooling: "none" })).tolist()[0].slice(1, -1);
  const toks = pipe.tokenizer.tokenize(t);
  tokens[t] = { tokens: toks, vectors: rows.slice(0, toks.length).map(round) };
}
writeFileSync("src/test/fixtures/embeddings.json", JSON.stringify({ model: "Xenova/all-MiniLM-L6-v2 q8", sentences, tokens }));
console.log(`wrote ${SENTENCES.length} sentences, ${TOKEN_TEXTS.length} token texts`);
