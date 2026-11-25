/** Regression tests for the final-review findings (each failed before its fix). */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokenization from ".";
import { challenges } from "./challenges";
import { loadEncoder, tokenLabel, decodeTokens } from "./realTokenizers";
import { Stage } from "./Stage";
import { steps } from "./steps";
import { topSegmentations } from "./unigram";
import { createVocabLoader } from "./wordpiece";

const renderStep = (view: string) => {
  const i = steps.findIndex((s) => s.view === view);
  return render(<Stage step={steps[i]!} stepIndex={i} />);
};
const stepText = (id: string) => {
  const s = steps.find((x) => x.id === id)!;
  return [s.summary, ...s.body, s.tryIt, s.keyTakeaway].join(" ");
};

describe("F1: long text is counted in full, and capped displays say so", () => {
  it("Practice counts every token of a long document", async () => {
    renderStep("practice");
    const doc = screen.getByRole("textbox", { name: "Document" });
    act(() => fireEvent.change(doc, { target: { value: "word ".repeat(2000) } }));
    const windowField = await screen.findByRole("spinbutton", { name: /Context window/ });
    act(() => fireEvent.change(windowField, { target: { value: "2500" } }));
    await waitFor(() => expect(screen.getByTestId("context-status")).toHaveTextContent(/doesn't fit/i));
  });

  it("Intro tells the learner when it only shows the first 4,000 characters", async () => {
    renderStep("intro");
    act(() => fireEvent.change(screen.getByRole("textbox", { name: "Sample text" }), { target: { value: "x".repeat(5000) } }));
    expect(await screen.findByText(/first 4,000 characters/)).toBeInTheDocument();
  });
});

describe("F2: BERT vocabulary loader can retry after a failure", () => {
  it("does not keep a failed load cached", async () => {
    let fail = true;
    const load = createVocabLoader(() => (fail ? Promise.reject(new Error("offline")) : Promise.resolve({ default: "[PAD]\n[UNK]\n" })));
    await expect(load()).rejects.toThrow("offline");
    fail = false;
    expect((await load()).tokens).toEqual(["[PAD]", "[UNK]"]);
  });
});

describe("F4/F5/F11: display labels and decoding", () => {
  it("decodes the valid part of a token and hex-encodes only partial bytes", () => {
    expect(tokenLabel(new Uint8Array([0x20, 0xf0, 0x9f, 0xa4]))).toBe(" <0xF0><0x9F><0xA4>");
    expect(tokenLabel(new Uint8Array([0x96]))).toBe("<0x96>");
    expect(tokenLabel(new Uint8Array([0x68, 0x69]))).toBe("hi");
  });

  it("decodes a run of tokens back into readable text", async () => {
    const enc = await loadEncoder("cl100k_base");
    const text = "नमस्ते 🤖 日本";
    expect(decodeTokens(enc, enc.encode(text))).toBe(text);
  });

  it("in the real question, ' strawberry' is a single token", async () => {
    const enc = await loadEncoder("o200k_base");
    const ids = enc.encode("How many r's are in strawberry?");
    expect(ids.map((id) => tokenLabel(enc.tokenBytes(id)))).toContain(" strawberry");
  });
});

describe("F6: Unigram keeps every character and the copy doesn't overclaim", () => {
  it("does not drop the last character of an 80-character input", () => {
    const text = "a".repeat(80);
    expect(topSegmentations(text, 1)[0]!.pieces.join("").replace(/▁/g, "")).toHaveLength(80);
  });

  it("explains that spaces are normalised", () => {
    expect(stepText("sentencepiece")).toMatch(/normali[sz]/i);
  });
});

describe("lesson copy accuracy", () => {
  it("F4: does not claim the question splits strawberry into st/raw/berry", () => {
    const quirks = stepText("quirks");
    expect(quirks).toMatch(/single token/i);
    const q = challenges.find((c) => c.id === "strawberry")!;
    expect(q.options[q.correctIndex]).not.toMatch(/`st` `raw` `berry`\)/);
  });

  it("F7: mentions the three-way tie for the first BPE merge", () => {
    expect(stepText("bpe-training")).toMatch(/tie/i);
    expect(challenges.find((c) => c.id === "bpe-first-merge")!.explanation).toMatch(/tie/i);
  });

  it("F8: attributes the glitch-token behaviour to GPT-3-era models", () => {
    expect(stepText("quirks")).toMatch(/GPT-3/);
  });

  it("F9: hedges unsourced rules of thumb", () => {
    expect(stepText("practice")).toMatch(/rough|rule of thumb/i);
    expect(stepText("sentencepiece")).not.toMatch(/typos/i);
  });
});

describe("F3: Vocabulary step and quiz coverage", () => {
  it("F15: has questions on numbers, leading spaces and cost", () => {
    const ids = tokenization.challenges.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(["numbers-chunks", "leading-space", "cost-estimate"]));
  });

  it("F15: shows a reversing-words demo", async () => {
    renderStep("quirks");
    expect(await screen.findByRole("article", { name: /Reversing/i })).toBeInTheDocument();
  });
});
