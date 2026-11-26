// @vitest-environment node
import { describe, expect, it } from "vitest";
import data from "./data/docs.json";
import emb from "./data/doc-embeddings.json";
import { mulberry32 } from "./random";
import { project2d } from "./umap";

describe("UMAP projection and data", () => {
  it("same seed gives the same layout", () => {
    const v = emb.vectors.slice(0, 30);
    const a = project2d(v, { nNeighbors: 8, minDist: 0.1, seed: 42 });
    const b = project2d(v, { nNeighbors: 8, minDist: 0.1, seed: 42 });
    expect(a).toHaveLength(30);
    expect(a).toEqual(b);
    expect(a.flat().every(Number.isFinite)).toBe(true);
  });

  it("seeded random is deterministic and in [0, 1)", () => {
    const r1 = mulberry32(5);
    const r2 = mulberry32(5);
    const xs = Array.from({ length: 100 }, () => r1());
    expect(xs).toEqual(Array.from({ length: 100 }, () => r2()));
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
  });

  it("doc embeddings match docs", () => {
    expect(emb.vectors).toHaveLength(data.docs.length);
    for (const v of emb.vectors) expect(v).toHaveLength(384);
  });
});
