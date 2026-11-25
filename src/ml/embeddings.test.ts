// @vitest-environment node
import { describe, expect, it } from "vitest";
import { MAX_SENTENCES, loadEmbedder } from "./embeddings";
import { cosine } from "./vector";

const norm = (v: Float32Array) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));

describe("MiniLM embedder (real model)", () => {
  it("embeds sentences as normalised 384-d vectors that capture meaning", async () => {
    const e = await loadEmbedder();
    const [a, b, c] = await e.embedSentences(["The film was great", "The movie was excellent", "Interest rates rose today"]);
    for (const v of [a!, b!, c!]) {
      expect(v).toHaveLength(384);
      expect(norm(v)).toBeCloseTo(1, 4);
    }
    expect(cosine(a!, b!)).toBeGreaterThan(cosine(a!, c!) + 0.3);
  });

  it("gives contextual per-token vectors, so 'bank' shifts with context", async () => {
    const e = await loadEmbedder();
    const loan = await e.embedTokens("The bank approved the loan");
    const river = await e.embedTokens("The river bank flooded");
    expect(loan.tokens).toEqual(["the", "bank", "approved", "the", "loan"]);
    expect(loan.vectors).toHaveLength(loan.tokens.length);
    const sim = cosine(loan.vectors[1]!, river.vectors[river.tokens.indexOf("bank")]!);
    expect(sim).toBeLessThan(0.95);
    expect(sim).toBeGreaterThan(0.3);
  });

  it("rejects more than MAX_SENTENCES at once and copes with long text", async () => {
    const e = await loadEmbedder();
    await expect(e.embedSentences(Array.from({ length: MAX_SENTENCES + 4 }, (_, i) => `s${i}`))).rejects.toThrow(/at most 8/);
    const [long] = await e.embedSentences(["word ".repeat(2000)]);
    expect(long).toHaveLength(384);
    const toks = await e.embedTokens("word ".repeat(2000));
    expect(toks.tokens.length).toBe(toks.vectors.length);
    expect(toks.tokens.length).toBeLessThanOrEqual(254);
  });

  it("returns nothing for empty input", async () => {
    const e = await loadEmbedder();
    expect(await e.embedSentences([])).toEqual([]);
    expect(await e.embedTokens("   ")).toEqual({ tokens: [], vectors: [] });
  });

  it("matches transformers.js's own mean pooling for short text", async () => {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowRemoteModels = false;
    env.localModelPath = `${process.cwd()}/public/models/`;
    const ref = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: "q8" });
    const texts = ["The bank approved the loan", "Short", "A slightly longer sentence about rivers and banks."];
    const expected = (await ref(texts, { pooling: "mean", normalize: true })).tolist() as number[][];
    const actual = await (await loadEmbedder()).embedSentences(texts);
    actual.forEach((v, i) => expect(cosine(v, expected[i]!)).toBeGreaterThan(0.99999));
  });

  it("flags input longer than the model's 256 word pieces (review F5)", async () => {
    const e = await loadEmbedder();
    expect(e.isTruncated("a short sentence")).toBe(false);
    expect(e.isTruncated("word ".repeat(300))).toBe(true);
  });

  it("can include [CLS]/[SEP], whose average is exactly the sentence vector (review F4)", async () => {
    const e = await loadEmbedder();
    const text = "The bank approved the loan";
    const all = await e.embedTokens(text, { withSpecial: true });
    expect(all.tokens[0]).toBe("[CLS]");
    expect(all.tokens.at(-1)).toBe("[SEP]");
    const [sentence] = await e.embedSentences([text]);
    const { meanPool, cosine: cos } = await import("./vector");
    expect(cos(meanPool(all.vectors), sentence!)).toBeGreaterThan(0.99999);
  });
});
