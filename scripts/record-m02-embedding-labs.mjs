#!/usr/bin/env node
// Record REAL all-MiniLM-L6-v2 outputs for Module 02's embedding labs (steps 12–14), 4 decimals:
//   - padded: one short sentence batched with a long one, so its row is padded; the hidden state of
//     every position (pad positions included) with the attention mask, and with an all-ones mask
//   - traps: sentence vectors for pairs where similarity scores mislead
//   - hybrid: sentence vectors for error-code documents and queries, where exact keywords matter
//   node scripts/record-m02-embedding-labs.mjs
import { AutoModel, AutoTokenizer, Tensor, env, pipeline } from "@huggingface/transformers";
import { writeFileSync } from "node:fs";

env.allowRemoteModels = false;
env.localModelPath = `${process.cwd()}/public/models/`;
const ID = "Xenova/all-MiniLM-L6-v2";
const pipe = await pipeline("feature-extraction", ID, { dtype: "q8" });
const tokenizer = await AutoTokenizer.from_pretrained(ID);
const model = await AutoModel.from_pretrained(ID, { dtype: "q8" });
const r4 = (v) => v.map((x) => Math.round(x * 1e4) / 1e4);
const sent = async (texts) => (await pipe(texts, { pooling: "mean", normalize: true })).tolist().map(r4);

// Padding: batch the short sentence with a long one, so the tokenizer pads it.
const SHORT = "The bank approved the loan";
const LONG = "Our savings account pays three percent interest, added monthly, and you can close it online at any time";
const enc = tokenizer([SHORT, LONG], { padding: true });
const withMask = (await model(enc)).last_hidden_state.tolist()[0];
const ones = { ...enc, attention_mask: new Tensor("int64", new BigInt64Array(enc.attention_mask.data.length).fill(1n), enc.attention_mask.dims) };
const noMask = (await model(ones)).last_hidden_state.tolist()[0];
const ids = enc.input_ids.tolist()[0].map(Number);
const mask = enc.attention_mask.tolist()[0].map(Number);
const tokens = ids.map((i) => tokenizer.decode([i]));
const padded = { short: SHORT, long: LONG, tokens, ids, mask, withMask: withMask.map(r4), noMask: noMask.map(r4), alone: (await sent([SHORT]))[0] };

const TRAP_PAIRS = [
  ["word order", "Dog bites man", "Man bites dog"],
  ["negation", "The transfer was approved", "The transfer was not approved"],
  ["opposite action", "How do I open a savings account?", "How do I close a savings account?"],
  ["numbers", "I was charged $10", "I was charged $10,000"],
  ["paraphrase, few shared words", "I can't sign in to my account", "My login details stopped working"],
  ["unrelated", "I can't sign in to my account", "What are your branch opening hours?"],
];
const trapTexts = [...new Set(TRAP_PAIRS.flatMap(([, a, b]) => [a, b]))];
const trapVecs = await sent(trapTexts);
const traps = { pairs: TRAP_PAIRS.map(([kind, a, b]) => ({ kind, a, b })), vectors: Object.fromEntries(trapTexts.map((t, i) => [t, trapVecs[i]])) };

const HYBRID_DOCS = [
  "Error E1043: the card reader could not read the chip",
  "Error E2091: the daily transfer limit was exceeded",
  "Error E3310: the payee's account details are invalid",
  "Error E4127: your session expired, please sign in again",
];
const HYBRID_QUERIES = [["what does E2091 mean", 1], ["E3310 when paying someone", 2], ["my payment failed because I sent too much today", 1]];
const hybrid = {
  docs: HYBRID_DOCS,
  doc_vectors: await sent(HYBRID_DOCS),
  queries: HYBRID_QUERIES.map(([q]) => q),
  query_vectors: await sent(HYBRID_QUERIES.map(([q]) => q)),
  answers: HYBRID_QUERIES.map(([, a]) => a),
};

const out = "src/subjects/02-tokens-embeddings/data/embedding-labs.json";
writeFileSync(out, JSON.stringify({ model: `${ID} q8`, padded, traps, hybrid }));
console.log(`wrote ${out}: ${tokens.length} padded positions (${mask.filter(Boolean).length} real), ${trapTexts.length} trap sentences, ${HYBRID_DOCS.length} + ${HYBRID_QUERIES.length} hybrid texts`);
