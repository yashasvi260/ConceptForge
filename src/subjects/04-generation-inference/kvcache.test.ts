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
    expect(kvCost(base, true).kvProjections).toBe(150);
    expect(kvCost(base, false).kvProjections).toBe(Array.from({ length: 51 }, (_, t) => 100 + t).reduce((a, b) => a + b));
    expect(kvCost(base, false).cacheBytes).toBe(0);
    expect(kvCost(base, false).attentionDots).toBeGreaterThan(kvCost(base, true).attentionDots * 10);
  });
});
