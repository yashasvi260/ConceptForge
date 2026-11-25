import { describe, expect, it } from "vitest";
import { bagOfWords, bowCosine, words } from "./bow";

describe("bag of words", () => {
  it("lower-cases and splits words, ignoring punctuation", () => {
    expect(words("The cat, the CAT!")).toEqual(["the", "cat", "the", "cat"]);
    expect(words("  ")).toEqual([]);
  });

  it("builds a vocabulary in first-seen order and counts words", () => {
    expect(bagOfWords(["the cat sat", "the cat ran"])).toEqual({
      vocab: ["the", "cat", "sat", "ran"],
      counts: [
        [1, 1, 1, 0],
        [1, 1, 0, 1],
      ],
    });
  });

  it("scores paraphrases by shared words only", () => {
    const { counts } = bagOfWords(["The film was great", "The movie was excellent"]);
    expect(bowCosine(counts[0]!, counts[1]!)).toBeCloseTo(0.5, 12);
  });

  it("can't see word order", () => {
    const { counts } = bagOfWords(["Dog bites man", "Man bites dog"]);
    expect(bowCosine(counts[0]!, counts[1]!)).toBeCloseTo(1, 12);
  });
});
