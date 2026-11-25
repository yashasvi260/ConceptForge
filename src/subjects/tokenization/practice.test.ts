import { describe, expect, it } from "vitest";
import { chunkByTokens, estimateCost } from "./practice";

describe("practice helpers", () => {
  it("estimates cost from a price per million tokens", () => {
    expect(estimateCost(1_000_000, 2.5)).toBe(2.5);
    expect(estimateCost(0, 2.5)).toBe(0);
    expect(estimateCost(2_000, 10)).toBeCloseTo(0.02, 10);
  });

  it("chunks token ids with overlap", () => {
    const ids = Array.from({ length: 10 }, (_, i) => i);
    expect(chunkByTokens(ids, 4, 1)).toEqual([[0, 4], [3, 7], [6, 10]]);
    expect(chunkByTokens(ids, 20, 5)).toEqual([[0, 10]]);
    expect(chunkByTokens([], 4, 1)).toEqual([]);
  });

  it("rejects an overlap as large as the chunk", () => {
    expect(() => chunkByTokens([1, 2, 3], 4, 4)).toThrow();
    expect(() => chunkByTokens([1, 2, 3], 0, 0)).toThrow();
  });
});
