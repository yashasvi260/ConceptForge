import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BANKING, GENERAL, HELD_OUT, PerplexityLab, RecapGenerateLab, RecapTokenizeLab, SmoothingLab, VOCAB, VsRealLab, perplexity, prob, tokenize, train } from "./RecapLabs";

const setSlider = (name: string, value: string) => {
  const s = screen.getByRole("slider", { name });
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(s, value);
    s.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

describe("recap labs mirror the mini-project", () => {
  it("25-token vocabulary and perplexity 25.07 → 12.89", () => {
    expect(VOCAB).toHaveLength(25);
    const base = train(tokenize(GENERAL));
    const tuned = train([...tokenize(GENERAL), ...tokenize(BANKING)]);
    expect(perplexity(base, tokenize(HELD_OUT)).toFixed(2)).toBe("25.07");
    expect(perplexity(tuned, tokenize(HELD_OUT)).toFixed(2)).toBe("12.89");
    expect(prob(base, "the", "loan", 0)).toBe(0);
    expect(prob(base, "the", "loan", 1)).toBeGreaterThan(0);
  });

  it("Tokenizer flags words outside the vocabulary", () => {
    render(<RecapTokenizeLab />);
    expect(screen.getByRole("status")).toHaveTextContent("not in the 25-token vocabulary: account");
  });

  it("Smoothing: k = 0 makes an unseen pair impossible", () => {
    render(<SmoothingLab />);
    expect(screen.getByRole("status")).toHaveTextContent("never seen, but possible");
    setSlider("Smoothing k (add k to every count)", "0");
    expect(screen.getByRole("status")).toHaveTextContent("impossible");
  });

  it("Generation: greedy from 'the' gets stuck in a loop", () => {
    render(<RecapGenerateLab />);
    expect(screen.getByRole("status").textContent!.split(" ")).toHaveLength(11);
  });

  it("Perplexity: shows 25.07 → 12.89 on held-out text, and is lower on training text", async () => {
    render(<PerplexityLab />);
    expect(screen.getByRole("status")).toHaveTextContent("Before 25.07, after fine-tuning 12.89");
    await userEvent.click(screen.getByRole("radio", { name: "The training text" }));
    const before = Number(screen.getByRole("status").textContent!.match(/Before ([\d.]+)/)![1]);
    expect(before).toBeLessThan(25.07);
  });

  it("Vs real: Llama 3 8B's exact parameter count", () => {
    render(<VsRealLab />);
    expect(screen.getByText("8,030,261,248")).toBeInTheDocument();
  });
});
