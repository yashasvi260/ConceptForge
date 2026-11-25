import { describe, expect, it } from "vitest";
import { HEADS, attentionMatrix, softmax, tokenizeWords } from "./attention";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("toy attention", () => {
  const tokens = tokenizeWords("The bank approved the loan");

  it("rows are probability distributions for every head", () => {
    for (const h of HEADS) for (const causal of [true, false]) for (const row of attentionMatrix(tokens, h.id, causal)) expect(sum(row)).toBeCloseTo(1, 9);
  });

  it("causal mask zeroes every future position", () => {
    attentionMatrix(tokens, 1, true).forEach((row, i) => row.forEach((p, j) => (j > i ? expect(p).toBe(0) : expect(p).toBeGreaterThan(0))));
  });

  it("previous-token head mostly looks one step back", () => {
    const m = attentionMatrix(tokens, 0, true);
    for (let i = 1; i < tokens.length; i++) expect(m[i]!.indexOf(Math.max(...m[i]!))).toBe(i - 1);
  });

  it("softmax handles temperature and masked entries", () => {
    expect(softmax([0, Number.NEGATIVE_INFINITY])).toEqual([1, 0]);
    expect(softmax([2, 1], 0.01)[0]).toBeGreaterThan(0.999);
    expect(softmax([Number.NEGATIVE_INFINITY])).toEqual([0]);
  });
});
