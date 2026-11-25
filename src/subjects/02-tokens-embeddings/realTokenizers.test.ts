import { describe, expect, it } from "vitest";
import { ENCODINGS, loadEncoder, tokenizeForDisplay, type EncodingName } from "./realTokenizers";

const names = Object.keys(ENCODINGS) as EncodingName[];

describe("real tokenizers", () => {
  it.each(names)("%s encodes 'hello world' as 2 tokens", async (name) => {
    const enc = await loadEncoder(name);
    expect(enc.encode("hello world")).toHaveLength(2);
  });

  it.each(names)("%s token bytes reassemble the exact original text", async (name) => {
    const enc = await loadEncoder(name);
    const text = "Tokenization 🤖 नमस्ते 日本語 café";
    const bytes = enc.encode(text).flatMap((id) => Array.from(enc.tokenBytes(id)));
    expect(new TextDecoder().decode(new Uint8Array(bytes))).toBe(text);
  });

  it.each(names)("%s treats special-token text typed by a user as plain text", async (name) => {
    const enc = await loadEncoder(name);
    const ids = enc.encode("<|endoftext|>");
    expect(ids.length).toBeGreaterThan(1);
    expect(ids).not.toContain(name === "o200k_base" ? 199999 : 100257);
  });

  it("caches the encoder", async () => {
    expect(await loadEncoder("cl100k_base")).toBe(await loadEncoder("cl100k_base"));
  });

  it("shows partial UTF-8 tokens as byte placeholders", async () => {
    const enc = await loadEncoder("cl100k_base");
    const pieces = tokenizeForDisplay(enc, "🤖").tokens.map((t) => t.text);
    expect(pieces.join("")).not.toContain("�");
    expect(pieces.some((p) => /<0x[0-9A-F]{2}>/.test(p)) || pieces.join("") === "🤖").toBe(true);
  });

  it("returns nothing for empty text and caps very long text", async () => {
    const enc = await loadEncoder("o200k_base");
    expect(tokenizeForDisplay(enc, "")).toEqual({ tokens: [], truncated: false });
    const long = tokenizeForDisplay(enc, "word ".repeat(2000));
    expect(long.truncated).toBe(true);
    expect(long.tokens.length).toBeLessThanOrEqual(4000);
  });

  it("pins the facts the lesson teaches (see docs/research/tokenization-sources.md)", async () => {
    const o200 = await loadEncoder("o200k_base");
    const cl100 = await loadEncoder("cl100k_base");
    const pieces = (enc: typeof o200, t: string) => tokenizeForDisplay(enc, t).tokens.map((x) => x.text);
    const hindi = "आज मौसम बहुत सुंदर है, चलो टहलने चलते हैं।";
    expect(o200.encode(hindi)).toHaveLength(14);
    expect(cl100.encode(hindi)).toHaveLength(45);
    expect(pieces(o200, "strawberry")).toEqual(["st", "raw", "berry"]);
    expect(pieces(cl100, "strawberry")).toEqual(["str", "aw", "berry"]);
    expect(o200.encode(" strawberry")).toHaveLength(1);
    expect(pieces(o200, "1234567")).toEqual(["123", "456", "7"]);
    expect(o200.encode(" SolidGoldMagikarp")).toHaveLength(5);
  });

  it("GPT-2 had ' SolidGoldMagikarp' as a single token", async () => {
    const { Tiktoken } = await import("js-tiktoken/lite");
    const gpt2 = new Tiktoken((await import("js-tiktoken/ranks/gpt2")).default);
    expect(gpt2.encode(" SolidGoldMagikarp", [], [])).toEqual([43453]);
  });
});
