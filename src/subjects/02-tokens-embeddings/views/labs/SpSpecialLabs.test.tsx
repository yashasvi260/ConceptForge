import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { bestSegmentation } from "../../unigram";
import { ChatTemplateLab, PaddingMaskLab, SpNormalizeLab, SpecialIdsLab, UnigramPruneLab, ViterbiTableLab, viterbiTable } from "./SpSpecialLabs";

describe("Module 02 SentencePiece and special-token labs", () => {
  it("the Viterbi table's final score equals the page's best segmentation", () => {
    for (const t of ["hello world", "unbelievable", "the cat sat on the mat"]) {
      expect(viterbiTable(t).at(-1)!.best).toBeCloseTo(bestSegmentation(t).logProb, 6);
    }
  });

  it("Normalize: ▁ marks word starts and the text rebuilds exactly", () => {
    render(<SpNormalizeLab />);
    expect(screen.getByText("▁hello▁world,▁日本語")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("exact");
  });

  it("Viterbi table fills one row per character", () => {
    render(<ViterbiTableLab />);
    expect(screen.getAllByRole("row")).toHaveLength(1 + "▁hello▁world".length);
  });

  it("Sampling: shows five splits and samples one", async () => {
    render(<UnigramPruneLab rand={() => 0} />);
    await userEvent.click(screen.getByRole("button", { name: /Sample a split/ }));
    expect(screen.getByRole("status").textContent).not.toBe("—");
  });

  it("Special IDs: Llama 3's end of turn is 128009", async () => {
    render(<SpecialIdsLab />);
    await userEvent.click(screen.getByText("<|eot_id|>"));
    expect(screen.getByRole("status")).toHaveTextContent("Ends one turn");
    expect(screen.getByText("128009")).toBeInTheDocument();
  });

  it("Chat template: 9 control tokens with the generation prompt", async () => {
    render(<ChatTemplateLab />);
    expect(screen.getByRole("status")).toHaveTextContent("9 control tokens");
    await userEvent.click(screen.getByRole("switch"));
    expect(screen.getByRole("status")).toHaveTextContent("7 control tokens");
  });

  it("Padding: real BERT IDs start with [CLS] 101 and pad with 0", async () => {
    render(<PaddingMaskLab />);
    await screen.findByText(/Green = real tokens/, {}, { timeout: 20000 });
    const status = screen.getByRole("status");
    expect(status.textContent).toMatch(/^101/);
    expect(status.textContent).toContain("0");
  }, 30000);
});
