import { describe, expect, it } from "vitest";
import { kvCacheBytes, kvCost } from "./kvcache";

const base = { promptTokens: 100, generatedTokens: 50, layers: 32, kvHeads: 32, headDim: 128, bytesPerValue: 2 };

describe("KV cache", () => {
  it("stores 2 × layers × kvHeads × headDim × tokens × bytes", () => {
    expect(kvCacheBytes(base)).toBe(2 * 32 * 32 * 128 * 150 * 2);
  });

  it("GQA with 8 KV heads needs a quarter of the memory of 32", () => {
    expect(kvCacheBytes({ ...base, kvHeads: 8 })).toBe(kvCacheBytes(base) / 4);
  });

  it("computes each token's K/V once with the cache, repeatedly without", () => {
    expect(kvCost(base, true).kvProjections).toBe(149);
    expect(kvCost(base, false).kvProjections).toBe(Array.from({ length: 50 }, (_, t) => 100 + t).reduce((a, b) => a + b));
    expect(kvCost(base, false).cacheBytes).toBe(0);
    expect(kvCost(base, false).attentionDots).toBeGreaterThan(kvCost(base, true).attentionDots * 10);
  });

  it("matches GPT-2's real loop: a 5-token prompt and 20 steps feed 24 tokens with the cache, 290 without", () => {
    const real = { ...base, promptTokens: 5, generatedTokens: 20 };
    expect(kvCost(real, true).kvProjections).toBe(24);
    expect(kvCost(real, false).kvProjections).toBe(290);
    expect(kvCost({ ...real, promptTokens: 3, generatedTokens: 3 }, true).attentionDots).toBe(6 + 4 + 5);
    expect(kvCost({ ...real, promptTokens: 3, generatedTokens: 3 }, false).attentionDots).toBe(6 + 10 + 15);
  });
});
