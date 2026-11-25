/**
 * Published model configurations (sources in docs/research/part2-sources.md) and an exact parameter count
 * computed from them. GPT-2/GPT-3 style: learned position table, LayerNorm with bias, 4× MLP, tied output head.
 * Llama style: RoPE (no position table), RMSNorm without bias, SwiGLU (3 matrices), grouped-query attention.
 */
export interface ModelConfig {
  id: string;
  name: string;
  family: "gpt2" | "llama";
  vocab: number;
  dModel: number;
  layers: number;
  heads: number;
  kvHeads: number;
  ffn: number;
  context: number;
  trainingTokens?: number;
  tiedEmbeddings: boolean;
  year: number;
  source: string;
}

export const MODEL_CONFIGS: ModelConfig[] = [
  {
    id: "gpt2-small",
    name: "GPT-2 small",
    family: "gpt2",
    vocab: 50_257,
    dModel: 768,
    layers: 12,
    heads: 12,
    kvHeads: 12,
    ffn: 3072,
    context: 1024,
    tiedEmbeddings: true,
    year: 2019,
    source: "https://huggingface.co/openai-community/gpt2/blob/main/config.json",
  },
  {
    id: "llama3-8b",
    name: "Llama 3 8B",
    family: "llama",
    vocab: 128_256,
    dModel: 4096,
    layers: 32,
    heads: 32,
    kvHeads: 8,
    ffn: 14_336,
    context: 8192,
    trainingTokens: 15e12,
    tiedEmbeddings: false,
    year: 2024,
    source: "https://github.com/meta-llama/llama3/blob/main/MODEL_CARD.md",
  },
  {
    id: "gpt3-175b",
    name: "GPT-3 175B",
    family: "gpt2",
    vocab: 50_257,
    dModel: 12_288,
    layers: 96,
    heads: 96,
    kvHeads: 96,
    ffn: 49_152,
    context: 2048,
    trainingTokens: 300e9,
    tiedEmbeddings: true,
    year: 2020,
    source: "https://arxiv.org/abs/2005.14165",
  },
];

export interface ParamBreakdown {
  /** Token embedding table (+ learned position table for GPT-style models). */
  embedding: number;
  /** All transformer blocks plus the final norm. */
  layers: number;
  /** Separate output head (0 when it shares the embedding table). */
  head: number;
  total: number;
}

export function paramBreakdown(c: ModelConfig): ParamBreakdown {
  const d = c.dModel;
  let embedding: number;
  let perLayer: number;
  let finalNorm: number;
  if (c.family === "gpt2") {
    embedding = c.vocab * d + c.context * d;
    const attention = d * 3 * d + 3 * d + d * d + d; // fused Q,K,V + output projection, with biases
    const mlp = d * c.ffn + c.ffn + c.ffn * d + d;
    const norms = 2 * (2 * d); // two LayerNorms (scale + bias)
    perLayer = attention + mlp + norms;
    finalNorm = 2 * d;
  } else {
    embedding = c.vocab * d;
    const headDim = d / c.heads;
    const attention = d * d + 2 * d * (c.kvHeads * headDim) + d * d; // Q, K, V (shared by query groups), O
    const mlp = 3 * d * c.ffn; // SwiGLU: gate, up, down
    const norms = 2 * d; // two RMSNorms (scale only)
    perLayer = attention + mlp + norms;
    finalNorm = d;
  }
  const layers = c.layers * perLayer + finalNorm;
  const head = c.tiedEmbeddings ? 0 : c.vocab * d;
  return { embedding, layers, head, total: embedding + layers + head };
}

export const fmt = (n: number) => n.toLocaleString("en-US");

/** 8_030_261_248 → "8.03 B" */
export function short(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(n >= 1e13 ? 0 : 1)} T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} M`;
  return fmt(n);
}
