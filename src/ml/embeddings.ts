/**
 * Real sentence embeddings in the browser: all-MiniLM-L6-v2 (Apache-2.0, 384 dimensions, mean pooling)
 * via transformers.js. The model and the ONNX Runtime wasm are served by this site itself
 * (public/models, public/ort), never fetched from a CDN, and are lazy-loaded on first use.
 */
import { meanPool } from "./vector";

export const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
export const MAX_SENTENCES = 8;
/** Input limit from the model card, including [CLS] and [SEP]. */
export const MAX_WORD_PIECES = 256;

export interface Embedder {
  /** Normalised 384-d sentence vectors (mean pooling). At most MAX_SENTENCES per call. */
  embedSentences(texts: string[]): Promise<Float32Array[]>;
  /** Contextual vector for every word piece ([CLS]/[SEP] removed; long input truncated by the model). */
  embedTokens(text: string): Promise<{ tokens: string[]; vectors: Float32Array[] }>;
}

interface TensorLike {
  tolist(): unknown;
}
type Pipe = {
  tokenizer: ((texts: string | string[], opts: Record<string, unknown>) => { input_ids: TensorLike; attention_mask: TensorLike }) & {
    tokenize(text: string): string[];
  };
  model: (inputs: Record<string, TensorLike>) => Promise<{ last_hidden_state: TensorLike }>;
};

/** Node (tests, scripts) reads the model from disk; browsers fetch it from this site. */
const isNode = typeof process !== "undefined" && typeof process.versions?.node === "string";

async function createEmbedder(onProgress?: (percent: number) => void): Promise<Embedder> {
  const { env, pipeline } = await import("@huggingface/transformers");
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  if (isNode) {
    env.localModelPath = `${process.cwd()}/public/models/`;
  } else {
    const base = import.meta.env.BASE_URL;
    env.localModelPath = `${base}models/`;
    const ortWasm = (env.backends.onnx as { wasm?: { wasmPaths?: unknown } }).wasm;
    if (ortWasm) {
      // Mirror transformers.js's own choice (asyncify; plain build for old Safari) but from this site.
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
      const oldSafari = /Version\/(1\d|2[0-5])\..*Safari/.test(ua) && !("gpu" in navigator);
      const suffix = oldSafari ? "" : ".asyncify";
      ortWasm.wasmPaths = { mjs: `${base}ort/ort-wasm-simd-threaded${suffix}.mjs`, wasm: `${base}ort/ort-wasm-simd-threaded${suffix}.wasm` };
    }
  }
  const pipe = (await pipeline("feature-extraction", MODEL_ID, {
    dtype: "q8",
    progress_callback: (p: { status?: string; file?: string; progress?: number }) => {
      if (p.status === "progress" && p.file?.endsWith(".onnx") && typeof p.progress === "number") onProgress?.(p.progress);
    },
  })) as unknown as Pipe;
  onProgress?.(100);

  /** Hidden states per word piece, with the model card's 256-piece limit (transformers.js would use 512). */
  async function run(texts: string[]): Promise<{ hidden: number[][][]; mask: number[][] }> {
    const inputs = pipe.tokenizer(texts, { padding: true, truncation: true, max_length: MAX_WORD_PIECES });
    const { last_hidden_state } = await pipe.model(inputs as unknown as Record<string, TensorLike>);
    const mask = (inputs.attention_mask.tolist() as (number | bigint)[][]).map((row) => row.map(Number));
    return { hidden: last_hidden_state.tolist() as number[][][], mask };
  }

  return {
    async embedSentences(texts) {
      if (texts.length > MAX_SENTENCES) throw new Error(`Embed at most ${MAX_SENTENCES} sentences at once`);
      if (texts.length === 0) return [];
      const { hidden, mask } = await run(texts);
      return hidden.map((rows, i) => {
        // Mean pooling over real (non-padding) word pieces, then L2-normalise, as in the model card.
        const kept = rows.filter((_, j) => mask[i]![j] === 1);
        const v = meanPool(kept);
        const n = Math.hypot(...v) || 1;
        return v.map((x) => x / n);
      });
    },
    async embedTokens(text) {
      if (!text.trim()) return { tokens: [], vectors: [] };
      const { hidden } = await run([text]);
      const pieces = hidden[0]!.slice(1, -1); // drop [CLS] and [SEP]
      const tokens = pipe.tokenizer.tokenize(text).slice(0, pieces.length);
      return { tokens, vectors: pieces.slice(0, tokens.length).map((v) => Float32Array.from(v)) };
    },
  };
}

let cached: Promise<Embedder> | null = null;

/** Load (once) the embedding model. Failures are not cached, so a retry really retries. */
export function loadEmbedder(onProgress?: (percent: number) => void): Promise<Embedder> {
  if (!cached) {
    const p = createEmbedder(onProgress);
    p.catch(() => {
      if (cached === p) cached = null;
    });
    cached = p;
  }
  return cached;
}
