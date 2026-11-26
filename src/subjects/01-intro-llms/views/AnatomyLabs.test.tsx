import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tiktoken } from "js-tiktoken/lite";
import gpt2Ranks from "js-tiktoken/ranks/gpt2";
import { describe, expect, it } from "vitest";
import recorded from "../data/generation-tree.json";
import { AttentionLab, LogitsLab, NormResidualLab, PositionLab, TOY_X, TokenLookupLab, attentionRow, layerNorm, rmsNorm, sinusoid } from "./AnatomyLabs";
import type { GenRecording } from "./labkit";

const setSlider = (name: string, value: string) => {
  const s = screen.getByRole("slider", { name });
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(s, value);
    s.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

describe("anatomy helpers", () => {
  it("attention on the worked example's vectors gives the worked example's weights", () => {
    const r = attentionRow(TOY_X, 2, { causal: true, scale: true });
    expect(r.weights.map((w) => Number(w.toFixed(3)))).toEqual([0.241, 0.309, 0.45]);
    expect(r.mixed.map((v) => Number(v.toFixed(3)))).toEqual([0.241, 0.309, 0.605, 0.225]);
    expect(attentionRow(TOY_X, 0, { causal: false, scale: true }).weights[2]).toBeGreaterThan(0);
  });

  it("norms: LayerNorm has mean 0, RMSNorm has root-mean-square 1, and both ignore scaling", () => {
    const x = [3, -1, 0.5, 8];
    expect(layerNorm(x).reduce((a, b) => a + b, 0)).toBeCloseTo(0);
    expect(Math.sqrt(rmsNorm(x).reduce((a, b) => a + b * b, 0) / 4)).toBeCloseTo(1, 3);
    expect(layerNorm(x.map((v) => v * 50))[3]).toBeCloseTo(layerNorm(x)[3]!, 3);
  });

  it("sinusoidal positions start at sin 0 = 0 and cos 0 = 1", () => {
    expect(sinusoid(0).slice(0, 2)).toEqual([0, 1]);
    expect(sinusoid(1)[0]).toBeCloseTo(Math.sin(1));
  });
});

describe("anatomy labs", () => {
  it("Token lookup shows GPT-2's real IDs for “The cat sat”", async () => {
    render(<TokenLookupLab load={() => Promise.resolve(new Tiktoken(gpt2Ranks))} />);
    const input = screen.getByLabelText("Your text");
    await userEvent.clear(input);
    await userEvent.type(input, "The cat sat");
    for (const id of ["464", "3797", "3332"]) expect(await screen.findByText(id)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("3 tokens → a 3 × 768 grid");
  });

  it("Word order: identical without positions, different with them", async () => {
    render(<PositionLab />);
    expect(screen.getByRole("status")).toHaveTextContent("Identical");
    await userEvent.click(screen.getByRole("switch", { name: "Add position information" }));
    expect(screen.getByRole("status")).toHaveTextContent("Different");
  });

  it("Attention: switching off the mask lets 'the' see later tokens", async () => {
    render(<AttentionLab />);
    expect(screen.getByRole("status")).toHaveTextContent("[0.241, 0.309, 0.605, 0.225]");
    await userEvent.click(screen.getByRole("button", { name: "the" }));
    expect(screen.getByRole("status")).toHaveTextContent("[1, 0, 0, 0]");
    await userEvent.click(screen.getByRole("switch", { name: "Causal mask (no peeking ahead)" }));
    expect(screen.getByRole("status")).not.toHaveTextContent("[1, 0, 0, 0]");
  });

  it("Norm & residual: scaling the input changes the input row but not the normalised rows", () => {
    render(<NormResidualLab />);
    const ln = () => screen.getByRole("rowheader", { name: "LayerNorm (GPT-2)" }).parentElement!.textContent;
    const before = ln();
    setSlider("Multiply the whole vector by", "50");
    expect(ln()).toBe(before);
  });

  it("Logits: adding a constant changes the scores but not the probabilities", async () => {
    render(<LogitsLab load={() => Promise.resolve(recorded as unknown as GenRecording)} />);
    const bars = await screen.findByRole("list", { name: /Softmax of the scores/ });
    const probs = () => within(bars).getAllByText(/%$/).map((e) => e.textContent);
    const before = probs();
    setSlider("Add to every score", "3");
    expect(probs()).toEqual(before);
    setSlider("Multiply every score", "0.5");
    expect(probs()).not.toEqual(before);
  });
});
