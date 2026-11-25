import { describe, expect, it } from "vitest";
import { gelu, relu, silu, swiglu } from "./ffn";

describe("feed-forward activations", () => {
  it("GELU (tanh approximation)", () => {
    expect(gelu(0)).toBe(0);
    expect(gelu(3)).toBeCloseTo(2.996363, 5);
    expect(gelu(-3)).toBeCloseTo(-0.003637, 5);
  });

  it("SiLU / Swish₁(x) = x·σ(x)", () => {
    expect(silu(0)).toBe(0);
    expect(silu(2)).toBeCloseTo(2 / (1 + Math.exp(-2)), 12);
  });

  it("SwiGLU gates the up-projection with Swish of the gate projection", () => {
    expect(swiglu([2, -1], [3, 5])).toEqual([silu(2) * 3, silu(-1) * 5]);
  });

  it("ReLU", () => {
    expect([relu(-2), relu(3)]).toEqual([0, 3]);
  });
});
