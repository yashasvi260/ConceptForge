import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CtxCostLab, LossByContextLab, PositionLimitLab, SlidingWindowLab, windowProducts } from "./LongContextLabs";

describe("Module 04 long-context labs", () => {
  it("Attention's share: 13.3% for Llama 3 8B at 8,192; equal at 53,250", () => {
    render(<CtxCostLab />);
    expect(screen.getByRole("status")).toHaveTextContent("Llama 3 8B at 8,192 tokens: attention is 13.3% of the work per token; it equals the rest at 53,250 tokens (6.5× its trained context of 8,192).");
    fireEvent.change(screen.getByRole("slider", { name: "Context length" }), { target: { value: "17" } });
    expect(screen.getByRole("status")).toHaveTextContent("at 131,072 tokens: attention is 71.1%");
  });

  it("Context helps: real loss 3.48 with 257–1,023 tokens of context", async () => {
    render(<LossByContextLab />);
    expect(screen.getByRole("status")).toHaveTextContent("With 257–1,023 tokens of context: average loss 3.48 over 6,136 predictions, perplexity 32.5.");
    await userEvent.click(screen.getByRole("radio", { name: "2–4" }));
    expect(screen.getByRole("status")).toHaveTextContent("With 2–4 tokens of context: average loss 5.181 over 24 predictions, perplexity 177.9.");
  });

  it("Positions: a slow pair leaves the trained range at 32,768; interpolation brings it back", () => {
    render(<PositionLimitLab />);
    expect(screen.getByRole("status")).toHaveTextContent(/Pair 48, position 32,767: 1\.743 rad; training covered angles up to 0\.436 rad\. Outside the trained range/);
    fireEvent.click(screen.getByRole("switch", { name: "Position interpolation" }));
    expect(screen.getByRole("status")).toHaveTextContent(/Inside the trained range\./);
    expect(screen.getByText(/raised a real IndexError/)).toBeInTheDocument();
  });

  it("Sliding window: 16 tokens with window 4 need 58 of 136 products", () => {
    expect(windowProducts(100, 4)).toBe(394);
    render(<SlidingWindowLab />);
    expect(screen.getByRole("status")).toHaveTextContent("16 tokens, window 4: 58 of 136 query-key products; the cache keeps the last 4 tokens instead of 16.");
    expect(screen.getByText(/0\.54 GB instead of 4\.29 GB/)).toBeInTheDocument();
  });
});
