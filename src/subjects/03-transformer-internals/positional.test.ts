import { describe, expect, it } from "vitest";
import { rope, sinusoidal } from "./positional";

const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i]!, 0);
const norm = (a: number[]) => Math.sqrt(dot(a, a));

describe("sinusoidal positions (Vaswani et al. §3.5)", () => {
  it("uses sin on even and cos on odd dimensions", () => {
    expect(sinusoidal(0, 4)).toEqual([0, 1, 0, 1]);
    const p = sinusoidal(3, 4);
    expect(p[0]).toBeCloseTo(Math.sin(3), 12);
    expect(p[1]).toBeCloseTo(Math.cos(3), 12);
    expect(p[2]).toBeCloseTo(Math.sin(3 / 100), 12); // 10000^(2/4) = 100
  });
});

describe("RoPE (Su et al. 2021)", () => {
  const q = [0.3, -1.2, 0.8, 0.5, -0.4, 1.1, 0.9, -0.7];
  const k = [1.0, 0.2, -0.6, 0.4, 0.7, -0.3, 0.1, 0.5];

  it("is the identity at position 0 and preserves length", () => {
    expect(rope(q, 0)).toEqual(q);
    expect(norm(rope(q, 17))).toBeCloseTo(norm(q), 12);
  });

  it("makes q·k depend only on the relative distance", () => {
    expect(dot(rope(q, 5), rope(k, 2))).toBeCloseTo(dot(rope(q, 13), rope(k, 10)), 9);
    expect(dot(rope(q, 5), rope(k, 2))).not.toBeCloseTo(dot(rope(q, 5), rope(k, 4)), 3);
  });
});
