import { describe, expect, it } from "vitest";
import { UNIGRAM_VOCAB, bestSegmentation, normalize, topSegmentations } from "./unigram";

describe("unigram", () => {
  it("marks spaces with ▁ (U+2581), SentencePiece style", () => {
    expect(normalize("hello world")).toBe("▁hello▁world");
    expect(normalize("  a  ")).toBe("▁a");
  });

  it("picks the most probable segmentation (Viterbi)", () => {
    const best = bestSegmentation("hello world");
    expect(best.pieces.join("")).toBe("▁hello▁world");
    expect(best.pieces[0]).toBe("▁hello");
  });

  it("ranks alternatives from most to least probable, best first", () => {
    const top = topSegmentations("hello world", 3);
    expect(top).toHaveLength(3);
    expect(top[0]).toEqual(bestSegmentation("hello world"));
    expect(top[0]!.logProb).toBeGreaterThanOrEqual(top[1]!.logProb);
    expect(top[1]!.logProb).toBeGreaterThanOrEqual(top[2]!.logProb);
    expect(new Set(top.map((t) => t.pieces.join("|"))).size).toBe(3);
    for (const t of top) expect(t.pieces.join("")).toBe("▁hello▁world");
  });

  it("is lossless: joining pieces and swapping ▁ for spaces restores the text", () => {
    const text = "unbelievable tokenization 🤖 日本語";
    expect(bestSegmentation(text).pieces.join("").replace(/▁/g, " ").trim()).toBe(text);
  });

  it("uses only log-probabilities ≤ 0 and handles empty and long input", () => {
    expect(Object.values(UNIGRAM_VOCAB).every((lp) => lp <= 0)).toBe(true);
    expect(bestSegmentation("").pieces).toEqual([]);
    expect(topSegmentations("", 3)).toEqual([]);
    const t0 = performance.now();
    bestSegmentation("the tokenizer splits words ".repeat(200));
    expect(performance.now() - t0).toBeLessThan(400);
  });
});
