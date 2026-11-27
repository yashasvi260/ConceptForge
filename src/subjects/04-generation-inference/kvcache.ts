export interface KvConfig {
  promptTokens: number;
  generatedTokens: number;
  layers: number;
  /** Number of key/value heads (fewer than query heads with GQA). */
  kvHeads: number;
  headDim: number;
  bytesPerValue: number;
}

/** Cache size at the end: 2 (K and V) × layers × kvHeads × headDim × tokens × bytes. */
export function kvCacheBytes(c: KvConfig): number {
  return 2 * c.layers * c.kvHeads * c.headDim * (c.promptTokens + c.generatedTokens) * c.bytesPerValue;
}

export interface KvCost {
  kvProjections: number;
  attentionDots: number;
  cacheBytes: number;
}

/**
 * Work over a whole generation of G tokens after a P-token prompt: G forward passes (step t = 0 … G-1).
 * K/V projections are counted in token positions, attention in query·key products per head per layer.
 * Without a cache, step t reprocesses all P + t tokens; with one, step 0 reads the prompt and every later step
 * feeds only the newest token, whose query meets P + t cached keys (itself included). Matches the real GPT-2 loop:
 * P = 5, G = 20 → 24 tokens fed with the cache, 290 without.
 */
export function kvCost(c: KvConfig, cacheOn: boolean): KvCost {
  const P = c.promptTokens;
  const G = c.generatedTokens;
  const tri = (n: number) => (n * (n + 1)) / 2;
  let kvProjections = 0;
  let attentionDots = 0;
  if (cacheOn) {
    kvProjections = P + G - 1;
    attentionDots = tri(P);
    for (let t = 1; t < G; t++) attentionDots += P + t;
  } else {
    for (let t = 0; t < G; t++) {
      kvProjections += P + t;
      attentionDots += tri(P + t);
    }
  }
  // At the end the cache holds every token fed so far: the prompt and all but the last generated token.
  return { kvProjections, attentionDots, cacheBytes: cacheOn ? kvCacheBytes({ ...c, generatedTokens: G - 1 }) : 0 };
}
