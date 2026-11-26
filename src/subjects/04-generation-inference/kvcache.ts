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

/** Work counted in token-positions (K/V projections) and query·key products, over the whole generation. */
export function kvCost(c: KvConfig, cacheOn: boolean): KvCost {
  const P = c.promptTokens;
  const G = c.generatedTokens;
  let kvProjections = 0;
  let attentionDots = 0;
  if (cacheOn) {
    kvProjections = P + G;
    attentionDots = (P * (P + 1)) / 2;
    for (let t = 1; t <= G; t++) attentionDots += P + t;
  } else {
    for (let t = 0; t <= G; t++) {
      const L = P + t;
      kvProjections += L;
      attentionDots += (L * (L + 1)) / 2;
    }
  }
  return { kvProjections, attentionDots, cacheBytes: cacheOn ? kvCacheBytes(c) : 0 };
}
