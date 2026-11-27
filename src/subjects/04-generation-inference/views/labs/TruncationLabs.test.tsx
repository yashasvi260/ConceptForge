import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { NucleusLab, SamplerChainLab, TailMassLab, TopKFixedLab, chain } from "./TruncationLabs";

describe("Module 04 truncation labs (real GPT-2 small)", () => {
  it("chain follows HF's order: temperature before top-p", () => {
    // softmax([2,1,0] / 2) = [.51, .31, .19]: top-p 0.6 keeps two; on the untempered [.67, .24, .09] it would keep one.
    expect(chain([2, 1, 0], { temperature: 2, topK: 3, topP: 0.6, minP: 0 }).counts).toEqual([3, 2, 2]);
    expect(chain([2, 1, 0], { temperature: 1, topK: 3, topP: 0.6, minP: 0 }).counts).toEqual([3, 1, 1]);
    const r = chain([3, 2, 1, 0], { temperature: 1, topK: 2, topP: 1, minP: 0 });
    expect(r.probs[0]).toBeCloseTo(0.731, 3);
    expect(r.probs.slice(2)).toEqual([0, 0]);
  });

  it("Tail: outside the top 100, France leaves 37.6%", async () => {
    render(<TailMassLab />);
    expect(screen.getByRole("status")).toHaveTextContent("Outside the top 100: The capital of… 37.6%, The cat sat… 28.1%, Your loan application… 12.8%, My favourite thing… 8.6%.");
    await userEvent.click(screen.getByRole("radio", { name: "1,000" }));
    expect(screen.getByRole("status")).toHaveTextContent("The capital of… 13.5%");
  });

  it("Top-k: k = 40 keeps 52.6% to 85.9%", () => {
    render(<TopKFixedLab />);
    expect(screen.getByRole("status")).toHaveTextContent("k = 40 keeps between 52.6% (The capital of…) and 85.9% (My favourite thing…) of the probability.");
  });

  it("Top-p: p = 0.9 keeps 77 to 1,503 tokens", async () => {
    render(<NucleusLab />);
    expect(screen.getByRole("status")).toHaveTextContent("p = 0.9: the nucleus holds from 77 to 1,503 tokens.");
    await userEvent.click(screen.getByRole("radio", { name: "0.5" }));
    expect(screen.getByRole("status")).toHaveTextContent("p = 0.5: the nucleus holds from 4 to 32 tokens.");
  });

  it("Chain: on France at T = 0.8, top-p 0.9 on the renormalised top 40 keeps 18; min-p 0.1 cuts further", () => {
    render(<SamplerChainLab />);
    expect(screen.getByRole("status")).toHaveTextContent('T = 0.8: top-k keeps 40, top-p 0.90 keeps 18, min-p 0.00 keeps 18; " the" gets 24.0%.');
    fireEvent.change(screen.getByRole("slider", { name: "Min-p" }), { target: { value: "0.1" } });
    expect(screen.getByRole("status")).toHaveTextContent(/top-p 0\.90 keeps 18, min-p 0\.10 keeps 1[0-7];/);
  });
});
