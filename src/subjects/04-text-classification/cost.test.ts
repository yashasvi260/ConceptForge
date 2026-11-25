import { describe, expect, it } from "vitest";
import { estimateCost } from "./cost";

describe("cost estimate", () => {
  it("cost estimate", () => {
    expect(estimateCost(1_000_000, 0.15)).toBeCloseTo(0.15);
    expect(estimateCost(60, 0.15)).toBeCloseTo(0.000009);
    expect(estimateCost(0, 1)).toBe(0);
  });
});
