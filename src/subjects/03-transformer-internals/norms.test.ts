import { describe, expect, it } from "vitest";
import { layerNorm, rmsNorm } from "./norms";

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe("normalisation", () => {
  it("RMSNorm scales to root-mean-square 1 without re-centering", () => {
    const y = rmsNorm([3, 4]);
    expect(Math.sqrt(mean(y.map((v) => v * v)))).toBeCloseTo(1, 5);
    expect(y[1]! / y[0]!).toBeCloseTo(4 / 3, 9);
  });

  it("LayerNorm gives mean 0 and variance 1", () => {
    const y = layerNorm([1, 2, 3, 10]);
    expect(mean(y)).toBeCloseTo(0, 9);
    expect(mean(y.map((v) => v * v))).toBeCloseTo(1, 4);
  });
});
