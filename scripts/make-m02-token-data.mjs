#!/usr/bin/env node
// Real GPT-4 (cl100k_base) and GPT-4o (o200k_base) token data for Module 02's deep lessons:
// counts for the language samples, and the pieces of a few numbers and words. Re-run after changing the lists:
//   node scripts/make-m02-token-data.mjs
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
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
/** n_vocab as tiktoken defines it: the highest token id (a special token) + 1. */
const nVocab = (ranks) => Math.max(...Object.values(ranks.special_tokens)) + 1;
const bertVocab = readFileSync("src/subjects/02-tokens-embeddings/data/bert-base-uncased-vocab.txt", "utf8").split("\n").filter((l, i, a) => i < a.length - 1 || l);
const BERT_WORDS = ["[PAD]", "[UNK]", "[CLS]", "[SEP]", "[MASK]", "the", "bank", "river", "loan", "cat", "cats", "token", "##izer", "##s", "un", "##able", "##ably"];
/** Tokens as raw bytes: some tokens hold only part of a character (step 5). */
const BYTE_TEXTS = ["é", "🤖", "आज मौसम"];
const byteTokens = (e, text) => e.encode(text).map((id) => ({ id, bytes: [...e.textMap.get(id)] }));
/** Every BERT entry greedy longest-match could try on these words, so a slice gives the same pieces as the full vocabulary. */
const WP_WORDS = ["huggingface", "unaffable", "tokenization", "embeddings", "playing", "unbelievably", "cafe", "kubernetes", "transformers", "xylophone"];
const bertIndex = new Map(bertVocab.map((t, i) => [t, i]));
const wpSlice = {};
for (const sp of ["[PAD]", "[UNK]", "[CLS]", "[SEP]", "[MASK]"]) wpSlice[sp] = bertIndex.get(sp);
for (const w of WP_WORDS) {
  const ch = [...w];
  for (let i = 0; i < ch.length; i++) for (let j = i + 1; j <= ch.length; j++) {
    const sub = (i > 0 ? "##" : "") + ch.slice(i, j).join("");
    if (bertIndex.has(sub)) wpSlice[sub] = bertIndex.get(sub);
  }
}
/**
 * Llama 3's special tokens, quoted from Meta's tokenizer source
 * (https://github.com/meta-llama/llama3/blob/main/llama/tokenizer.py): they are numbered after the 128,000
 * ordinary tokens in this list order (0 begin_of_text, 1 end_of_text, 2–5 reserved, 6 start_header_id,
 * 7 end_header_id, 8 reserved, 9 eot_id), with 256 special slots in all (128,256 = Llama 3's vocabulary).
 */
const LLAMA3_ORDER = ["<|begin_of_text|>", "<|end_of_text|>", null, null, null, null, "<|start_header_id|>", "<|end_header_id|>", null, "<|eot_id|>"];
const llama3 = Object.fromEntries(LLAMA3_ORDER.map((t, i) => [t, 128000 + i]).filter(([t]) => t));
const endText = "<|endoftext|>";
const out = {
  special: {
    llama3,
    llama3_vocab: 128000 + 256,
    bert: Object.fromEntries(["[PAD]", "[UNK]", "[CLS]", "[SEP]", "[MASK]"].map((t) => [t, bertVocab.indexOf(t)])),
    gpt4_endoftext: {
      special_id: cl100k.special_tokens[endText],
      as_plain_text: enc.cl100k_base.encode(endText, [], []).map((id) => ({ id, text: enc.cl100k_base.decode([id]) })),
    },
  },
  wordpiece: { words: WP_WORDS, vocab: wpSlice },
  byte_tokens: Object.fromEntries(BYTE_TEXTS.map((t) => [t, { cl100k_base: byteTokens(enc.cl100k_base, t), o200k_base: byteTokens(enc.o200k_base, t) }])),
  vocab_sizes: { cl100k_base: nVocab(cl100k), o200k_base: nVocab(o200k), bert_base_uncased: bertVocab.length },
  bert_ids: Object.fromEntries(BERT_WORDS.map((w) => [w, bertVocab.indexOf(w)])),
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
