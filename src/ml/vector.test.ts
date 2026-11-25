import { describe, expect, it } from "vitest";
import { cosine, meanPool } from "./vector";

describe("vector maths", () => {
  it("computes cosine similarity", () => {
    expect(cosine([1, 0], [0, 1])).toBe(0);
    expect(cosine([1, 2], [2, 4])).toBeCloseTo(1, 12);
    expect(cosine([1, 0], [-1, 0])).toBeCloseTo(-1, 12);
  });

  it("returns 0, not NaN, for a zero vector", () => {
    expect(cosine([0, 0], [1, 2])).toBe(0);
  });

  it("averages vectors", () => {
    expect(Array.from(meanPool([[1, 2], [3, 6]]))).toEqual([2, 4]);
    expect(Array.from(meanPool([]))).toEqual([]);
  });
});
