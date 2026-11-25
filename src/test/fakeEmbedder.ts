/**
 * Stand-in embedder for jsdom tests (ONNX Runtime can't run there). Known texts return REAL MiniLM
 * outputs precomputed by scripts/make-embedding-fixtures.mjs; unknown texts get deterministic placeholder
 * vectors so views still render. Real-model behaviour is tested in src/ml/embeddings.test.ts (node).
 */
// Type-only import: importing values from ../ml/embeddings here would deadlock the vi.mock factory.
import type { Embedder } from "../ml/embeddings";
import fixtures from "./fixtures/embeddings.json";

const DIM = 384;
const MAX_SENTENCES = 8; // mirrors src/ml/embeddings.ts
const data = fixtures as unknown as {
  sentences: Record<string, number[]>;
  tokens: Record<string, { tokens: string[]; vectors: number[][] }>;
};

function placeholder(text: string): Float32Array {
  const v = new Float32Array(DIM);
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619);
  for (let i = 0; i < DIM; i++) {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
    v[i] = ((h >>> 0) / 0xffffffff) * 2 - 1;
  }
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
}

export const fakeEmbedder: Embedder = {
  async embedSentences(texts) {
    if (texts.length > MAX_SENTENCES) throw new Error(`Embed at most ${MAX_SENTENCES} sentences at once`);
    return texts.map((t) => (data.sentences[t] ? Float32Array.from(data.sentences[t]!) : placeholder(t)));
  },
  async embedTokens(text) {
    if (!text.trim()) return { tokens: [], vectors: [] };
    const known = data.tokens[text];
    if (known) return { tokens: known.tokens, vectors: known.vectors.map((v) => Float32Array.from(v)) };
    const tokens = text.toLowerCase().match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) ?? [];
    return { tokens, vectors: tokens.map((t, i) => placeholder(`${t}#${i}#${text}`)) };
  },
};
