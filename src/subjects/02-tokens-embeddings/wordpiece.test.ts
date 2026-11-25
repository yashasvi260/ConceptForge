import { describe, expect, it } from "vitest";
import vocabText from "./data/bert-base-uncased-vocab.txt?raw";
import { basicTokenize, encodeWordPiece, parseVocab } from "./wordpiece";

const vocab = parseVocab(vocabText);
const texts = (s: string) => encodeWordPiece(s, vocab).tokens.map((t) => t.text);

describe("BERT vocab", () => {
  it("has the real bert-base-uncased size and special-token ids", () => {
    expect(vocab.tokens).toHaveLength(30522);
    expect(["[PAD]", "[UNK]", "[CLS]", "[SEP]", "[MASK]"].map((t) => vocab.index.get(t))).toEqual([0, 100, 101, 102, 103]);
  });
});

describe("basicTokenize", () => {
  it("lower-cases, strips accents and splits punctuation like BERT", () => {
    expect(basicTokenize("Café, OK!")).toEqual(["cafe", ",", "ok", "!"]);
    expect(basicTokenize("a$b 日本")).toEqual(["a", "$", "b", "日", "本"]);
    expect(basicTokenize("hi🤖there")).toEqual(["hi🤖there"]); // emoji are symbols, not punctuation
    expect(basicTokenize("  ")).toEqual([]);
  });
});

describe("encodeWordPiece", () => {
  it("uses longest-match-first with ## continuations", () => {
    expect(texts("huggingface")).toEqual(["hugging", "##face"]);
    expect(texts("hugs")).toEqual(["hugs"]); // a whole word in BERT's vocabulary
  });

  it("gives the real bert-base-uncased splits", () => {
    expect(texts("tokenizer")).toEqual(["token", "##izer"]);
    expect(texts("unaffable")).toEqual(["una", "##ffa", "##ble"]);
    expect(texts("Strawberry")).toEqual(["strawberry"]);
  });

  it("returns real ids", () => {
    expect(encodeWordPiece("tokenizer", vocab).tokens.map((t) => t.id)).toEqual([19204, 17629]);
  });

  it("turns the whole word into [UNK] when any part can't be matched", () => {
    expect(texts("hello🤖world")).toEqual(["[UNK]"]);
    expect(encodeWordPiece("hello🤖world", vocab).tokens[0]!.id).toBe(100);
  });

  it("records the longest-match attempts", () => {
    const step = encodeWordPiece("huggingface", vocab).steps[0]!;
    expect(step.word).toBe("huggingface");
    expect(step.tried[0]).toBe("huggingface");
    expect(step.tried).toContain("hugging");
    expect(step.matched).toEqual(["hugging", "##face"]);
  });

  it("treats very long words as [UNK] and copes with long input", () => {
    expect(texts("a".repeat(101))).toEqual(["[UNK]"]);
    const t0 = performance.now();
    encodeWordPiece("tokenization is fun ".repeat(250), vocab);
    expect(performance.now() - t0).toBeLessThan(2000);
  });
});
