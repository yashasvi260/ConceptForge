import { describe, expect, it } from "vitest";
import { applySampling, greedy } from "./sampling";

const cands = [
  { token: "a", logit: 3 },
  { token: "b", logit: 2 },
  { token: "c", logit: 0 },
  { token: "d", logit: -2 },
];
const kept = (r: ReturnType<typeof applySampling>) => r.filter((c) => c.kept).map((c) => c.token);

describe("decoding", () => {
  it("greedy picks the highest logit", () => {
    expect(greedy(cands)).toBe("a");
  });

  it("top-k = 1 is greedy", () => {
    expect(kept(applySampling(cands, { temperature: 1, topK: 1, topP: 1 }))).toEqual(["a"]);
  });

  it("top-p keeps the smallest nucleus and renormalises", () => {
    const r = applySampling(cands, { temperature: 1, topK: 0, topP: 0.8 });
    expect(kept(r)).toEqual(["a", "b"]);
    expect(r.reduce((s, c) => s + c.finalProb, 0)).toBeCloseTo(1, 9);
  });

  it("very low temperature is nearly one-hot; high temperature flattens", () => {
    expect(applySampling(cands, { temperature: 0.01, topK: 0, topP: 1 })[0]!.finalProb).toBeGreaterThan(0.999);
    expect(applySampling(cands, { temperature: 3, topK: 0, topP: 1 })[0]!.finalProb).toBeLessThan(0.5);
  });
});
