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

// Deep-lesson mode: Module 01 exercise data (sentence vectors + every "bank" token vector), 4 decimals.
//   node scripts/make-embedding-fixtures.mjs --deep-out src/subjects/01-intro-llms/deep/data/minilm.json
const DEEP_SENTENCES = [
  "The film was great", "The movie was excellent", "Interest rates rose today", "Dog bites man", "Man bites dog",
  "How do I reset my password?", "I forgot my login details", "I can't sign in to my account",
  "What's the weather like tomorrow?", "Our quarterly revenue grew by 12%",
  "My card was charged twice", "I see a payment I don't recognise", "How do I send money abroad?", "What is the interest rate on my mortgage?",
];
const BANK_SENTENCES = ["The bank approved the loan", "I deposited cash at the bank", "The river bank flooded", "We had a picnic on the river bank"];
if (opt("deep-out")) {
  const r4 = (v) => v.map((x) => Math.round(x * 1e4) / 1e4);
  const sv = (await pipe(DEEP_SENTENCES, { pooling: "mean", normalize: true })).tolist();
  const sentences = Object.fromEntries(DEEP_SENTENCES.map((t, i) => [t, r4(sv[i])]));
  const bank = {};
  for (const t of BANK_SENTENCES) {
    const rows = (await pipe(t, { pooling: "none" })).tolist()[0].slice(1, -1);
    const toks = pipe.tokenizer.tokenize(t);
    const i = toks.indexOf("bank");
    if (i < 0) throw new Error(`no "bank" token in ${t}`);
    bank[t] = r4(rows[i]);
  }
  writeFileSync(opt("deep-out"), JSON.stringify({ model: "Xenova/all-MiniLM-L6-v2 q8", sentences, bank }));
  console.log(`wrote ${DEEP_SENTENCES.length} sentence vectors and ${BANK_SENTENCES.length} "bank" token vectors to ${opt("deep-out")}`);
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
