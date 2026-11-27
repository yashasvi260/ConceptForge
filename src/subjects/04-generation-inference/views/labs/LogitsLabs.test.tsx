import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EveryPositionLab, LmHeadLab, RealNextLab, SoftmaxShiftLab } from "./LogitsLabs";

describe("Module 04 logits labs (real GPT-2 small)", () => {
  it("LM head: h · e reproduces GPT-2's own logit for ' Paris'", async () => {
    render(<LmHeadLab />);
    expect(screen.getByRole("status")).toHaveTextContent('h · e(" Paris") = -101.22 (GPT-2 says -101.21); cosine -0.117.');
    await userEvent.click(screen.getByRole("button", { name: '" the"' }));
    expect(screen.getByRole("status")).toHaveTextContent('h · e(" the") = -100.25 (GPT-2 says -100.25)');
  });

  it("Softmax: a naive 32-bit softmax of logits near -130 is NaN; shifting them changes nothing", () => {
    render(<SoftmaxShiftLab />);
    expect(screen.getByRole("status")).toHaveTextContent('Top token " approved": naive 32-bit NaN, subtract the max 39.4%.');
    fireEvent.change(screen.getByRole("slider", { name: "Add to every logit" }), { target: { value: "150" } });
    expect(screen.getByRole("status")).toHaveTextContent('Top token " approved": naive 32-bit 39.4%, subtract the max 39.4%.');
  });

  it("Real distributions: France needs 1,503 tokens for 90%, weekends 77", async () => {
    render(<RealNextLab />);
    expect(screen.getByRole("status")).toHaveTextContent('" the" leads with 8.5%; entropy 8.654 bits; 1,503 tokens cover 90%.');
    await userEvent.click(screen.getByRole("radio", { name: "My favourite thing about weekends is" }));
    expect(screen.getByRole("status")).toHaveTextContent('" that" leads with 27.4%; entropy 5.299 bits; 77 tokens cover 90%.');
  });

  it("Every position: ' steady' cost 7.42; mean loss 4.224, perplexity 68.3", async () => {
    render(<EveryPositionLab />);
    expect(screen.getByRole("status")).toHaveTextContent('the real next token " steady" got 0.06%, loss 7.42.');
    expect(screen.getByText(/Mean loss 4.224, perplexity 68.3/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "After The bank approved the loan because the customer had a steady" }));
    expect(screen.getByRole("status")).toHaveTextContent('GPT-2 guessed " income" (34.7%)');
  });
});
