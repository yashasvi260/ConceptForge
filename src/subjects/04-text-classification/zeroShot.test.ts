import { describe, expect, it } from "vitest";
import { ZERO_SHOT_TEMPERATURE, zeroShot } from "./zeroShot";

const v = (...xs: number[]) => {
  const n = Math.hypot(...xs);
  return Float32Array.from(xs.map((x) => x / n));
};

describe("zero-shot classification", () => {
  it("zero-shot ranks the nearest label first", () => {
    const r = zeroShot(v(1, 0.1, 0), [v(0, 1, 0), v(1, 0, 0), v(0, 0, 1)]);
    expect(r.scores[1]).toBeGreaterThan(r.scores[0]!);
    expect(r.probs.indexOf(Math.max(...r.probs))).toBe(1);
    expect(r.probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it("scores are raw cosines; probabilities use the documented temperature", () => {
    const r = zeroShot(v(1, 0), [v(1, 0), v(0, 1)]);
    expect(r.scores[0]).toBeCloseTo(1, 6);
    expect(r.scores[1]).toBeCloseTo(0, 6);
    const e = Math.exp(1 / ZERO_SHOT_TEMPERATURE);
    expect(r.probs[0]).toBeCloseTo(e / (e + 1), 6);
  });
});
