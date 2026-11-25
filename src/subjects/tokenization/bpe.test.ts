import { describe, expect, it } from "vitest";
import { encodeBpe, trainBpe } from "./bpe";

// Sennrich, Haddow & Birch (2016), Algorithm 1: {'low':5, 'lower':2, 'newest':6, 'widest':3}
const SENNRICH = `${"low ".repeat(5)}${"lower ".repeat(2)}${"newest ".repeat(6)}${"widest ".repeat(3)}`;

describe("trainBpe", () => {
  it("learns the merges from Sennrich et al. (2016), most frequent pair first", () => {
    const { merges } = trainBpe(SENNRICH, 10);
    expect(merges.slice(0, 5).map((m) => m.merged)).toEqual(["es", "est", "est</w>", "lo", "low"]);
    expect(merges[0]).toMatchObject({ pair: ["e", "s"], count: 9 });
  });

  it("grows the vocabulary by exactly one symbol per merge", () => {
    const { merges, vocab, snapshots } = trainBpe(SENNRICH, 10);
    expect(snapshots).toHaveLength(merges.length + 1);
    const initial = new Set([...SENNRICH.replace(/\s/g, "")].concat("</w>")).size;
    expect(vocab).toHaveLength(initial + merges.length);
  });

  it("records word segmentations and pair counts at every step", () => {
    const { snapshots } = trainBpe(SENNRICH, 3);
    expect(snapshots[0]!.words.find((w) => w.freq === 6)!.symbols).toEqual(["n", "e", "w", "e", "s", "t", "</w>"]);
    expect(snapshots[3]!.words.find((w) => w.freq === 6)!.symbols).toEqual(["n", "e", "w", "est</w>"]);
    expect(snapshots[0]!.pairCounts[0]).toEqual({ pair: ["e", "s"], count: 9 });
  });

  it("stops cleanly when nothing is left to merge", () => {
    expect(trainBpe("", 5).merges).toEqual([]);
    expect(trainBpe("a", 5).merges).toEqual([{ pair: ["a", "</w>"], merged: "a</w>", count: 1 }]);
    expect(trainBpe("a b", 50).merges.length).toBeLessThanOrEqual(2);
  });

  it("handles emoji and accents as whole characters", () => {
    const { snapshots } = trainBpe("café 🤖🤖", 0);
    expect(snapshots[0]!.words.map((w) => w.symbols)).toEqual([
      ["c", "a", "f", "é", "</w>"],
      ["🤖", "🤖", "</w>"],
    ]);
  });
});

describe("encodeBpe", () => {
  const { merges } = trainBpe(SENNRICH, 10);

  it("splits an unseen word into learned pieces, applying merges in learned order", () => {
    const { tokens, trace } = encodeBpe("lowest", merges);
    expect(tokens).toEqual(["low", "est</w>"]);
    expect(trace.map((t) => t.merge.merged)).toEqual(["es", "est", "est</w>", "lo", "low"]);
    expect(trace[0]!.before).toEqual(["l", "o", "w", "e", "s", "t", "</w>"]);
  });

  it("falls back to characters when no merge applies", () => {
    expect(encodeBpe("xyz", merges).tokens).toEqual(["x", "y", "z", "</w>"]);
    expect(encodeBpe("", merges).tokens).toEqual([]);
  });

  it("is fast on long input", () => {
    const t0 = performance.now();
    trainBpe("the quick brown fox jumps over the lazy dog ".repeat(120), 40);
    encodeBpe("a".repeat(5000), merges);
    expect(performance.now() - t0).toBeLessThan(2000);
  });
});
