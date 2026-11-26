#!/usr/bin/env node
// Real GPT-4 (cl100k_base) and GPT-4o (o200k_base) token data for Module 02's deep lessons:
// counts for the language samples, and the pieces of a few numbers and words. Re-run after changing the lists:
//   node scripts/make-m02-token-data.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { Tiktoken } from "js-tiktoken/lite";
import cl100k from "js-tiktoken/ranks/cl100k_base";
import o200k from "js-tiktoken/ranks/o200k_base";

/** Same texts as LANGUAGE_SAMPLES in views/LanguagesView.tsx (the deep test checks they match). */
const LANGUAGES = [
  ["English", "The weather is beautiful today, let's go for a walk."],
  ["Spanish", "Hoy hace un tiempo precioso, vamos a dar un paseo."],
  ["Hindi", "आज मौसम बहुत सुंदर है, चलो टहलने चलते हैं।"],
  ["Japanese", "今日はとても良い天気なので、散歩に行きましょう。"],
  ["Code", "for (let i = 0; i < 10; i++) { console.log(i); }"],
  ["Numbers", "1234567 + 3.14159 = 1234570.14159"],
];
const PIECES = ["1234567", "2026", "3.14159", "strawberry", " strawberry", "STRAWBERRY", "unbelievably", " tokenizer"];

const enc = { cl100k_base: new Tiktoken(cl100k), o200k_base: new Tiktoken(o200k) };
const pieces = (e, text) => e.encode(text).map((id) => ({ id, text: e.decode([id]) }));
const out = {
  source: "js-tiktoken 1.0.21 (OpenAI tiktoken vocabularies)",
  languages: LANGUAGES.map(([label, text]) => ({
    label, text, chars: [...text].length, utf8_bytes: Buffer.byteLength(text, "utf8"),
    cl100k_base: enc.cl100k_base.encode(text).length, o200k_base: enc.o200k_base.encode(text).length,
  })),
  pieces: Object.fromEntries(PIECES.map((t) => [t, { cl100k_base: pieces(enc.cl100k_base, t), o200k_base: pieces(enc.o200k_base, t) }])),
};
mkdirSync("src/subjects/02-tokens-embeddings/deep/data", { recursive: true });
writeFileSync("src/subjects/02-tokens-embeddings/deep/data/tokens.json", JSON.stringify(out, null, 1));
console.log(out.languages.map((l) => `${l.label}: ${l.cl100k_base} / ${l.o200k_base}`).join("\n"));
