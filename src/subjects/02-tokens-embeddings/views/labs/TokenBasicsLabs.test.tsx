import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AddTokensLab, OovLab, SeqLengthLab, VocabBuysLab, VocabCostLab } from "./TokenBasicsLabs";

describe("Module 02 token-basics labs", () => {
  it("OOV: words miss cats/rug/🤖, bytes miss nothing", async () => {
    render(<OovLab />);
    expect(screen.getByRole("status")).toHaveTextContent("7 tokens, 3 unknown");
    await userEvent.click(screen.getByRole("radio", { name: "Bytes" }));
    expect(screen.getByRole("status")).toHaveTextContent("0 unknown");
  });

  it("Sequence length: the English sample is 12 GPT-4o tokens", () => {
    render(<SeqLengthLab />);
    const bars = screen.getByRole("list", { name: "Length of the sample" });
    expect(bars).toHaveTextContent("12");
    expect(bars).toHaveTextContent("52");
  });

  it("Vocabulary cost: GPT-2 small's table is 31.0% of the model", () => {
    render(<VocabCostLab />);
    expect(screen.getByRole("status")).toHaveTextContent("38,597,376");
    expect(screen.getByRole("status")).toHaveTextContent("31.0%");
  });

  it("Vocabulary buys: Hindi gains the most", () => {
    render(<VocabBuysLab />);
    expect(screen.getByRole("status")).toHaveTextContent("Biggest win: Hindi (69% fewer tokens)");
  });

  it("Adding tokens: 20 tokens to Llama 3 8B add 2 × 20 × 4096 parameters", () => {
    render(<AddTokensLab />);
    expect(screen.getByRole("status")).toHaveTextContent("163,840");
  });
});
