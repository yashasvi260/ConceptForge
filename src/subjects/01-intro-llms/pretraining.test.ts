import { describe, expect, it } from "vitest";
import { maskForMlm, nextTokenPairs } from "./pretraining";

/** Deterministic random source. */
function seq(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length]!;
}

describe("pre-training objectives", () => {
  it("next-token prediction pairs each prefix with the following word", () => {
    expect(nextTokenPairs(["the", "cat", "sat"])).toEqual([
      { context: ["the"], target: "cat" },
      { context: ["the", "cat"], target: "sat" },
    ]);
    expect(nextTokenPairs(["one"])).toEqual([]);
  });

  it("MLM chooses ~15% of positions and applies the 80/10/10 rule", () => {
    const words = Array.from({ length: 20 }, (_, i) => `w${i}`);
    // positions 0,1,2 chosen (< 0.15); then 0.5 → [MASK]; 0.85 → random word (+1 roll picks it); 0.95 → keep
    const rolls = [0.01, 0.5, 0.02, 0.85, 0.0, 0.03, 0.95, ...Array(17).fill(0.9)];
    const out = maskForMlm(words, seq(rolls), ["zzz"]);
    expect(out.map((t) => t.shown)).toEqual(["[MASK]", "zzz", "w2", ...words.slice(3)]);
    expect(out.filter((t) => t.predict).map((t) => t.original)).toEqual(["w0", "w1", "w2"]);
  });

  it("always predicts at least one word", () => {
    const out = maskForMlm(["a", "b"], () => 0.99, ["x"]);
    expect(out.filter((t) => t.predict)).toHaveLength(1);
  });
});
