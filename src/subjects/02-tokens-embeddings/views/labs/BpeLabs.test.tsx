import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DEFAULT_CORPUS } from "../../Stage";
import { BpeCompressLab, FertilityLab, MergeOrderLab, MergesCurveLab, PretokenizeLab, SENNRICH, VariantsLab, corpusSymbols } from "./BpeLabs";

describe("Module 02 BPE labs", () => {
  it("uses the same corpus as the BPE views, which starts at 95 symbols", () => {
    expect(SENNRICH).toBe(DEFAULT_CORPUS);
    expect(corpusSymbols(SENNRICH)).toBe(95);
  });

  it("Compression: 95 → 28 symbols after ten merges, as in the lesson", () => {
    render(<BpeCompressLab />);
    expect(screen.getByRole("status")).toHaveTextContent("95 symbols → 28 after 10 merges");
  });

  it("Pre-tokenizer: splits the example into the lesson's 12 chunks", () => {
    render(<PretokenizeLab />);
    const chips = Array.from(screen.getByRole("status").children).map((c) => c.textContent);
    expect(chips).toEqual(["I", "'m", "␣paying", "␣", "125", "0", ".", "75", "␣dollars", ",", "␣OK", "?"]);
  });

  it("Diminishing returns: the first merge saves more than the last", () => {
    render(<MergesCurveLab />);
    const m = screen.getByRole("status").textContent!.match(/Merge 1 saves (\d+); merge \d+ saves (\d+)/)!;
    expect(Number(m[1])).toBeGreaterThan(Number(m[2]));
  });

  it("Merge order: reversing the merges changes 'lowest'", async () => {
    render(<MergeOrderLab />);
    expect(screen.getByRole("status")).toHaveTextContent("low est</w>");
    await userEvent.click(screen.getByRole("radio", { name: "Reversed" }));
    expect(screen.getByRole("status")).toHaveTextContent("lo w es t </w>");
  });

  it("Fertility and variants use the real GPT-4o tokenizer", async () => {
    render(<FertilityLab />);
    const bars = await screen.findByRole("list", { name: "GPT-4o tokens per word" }, { timeout: 20000 });
    expect(within(bars).getAllByRole("listitem")).toHaveLength(5);
    render(<VariantsLab />);
    expect(await screen.findByText("st | raw | berry", {}, { timeout: 20000 })).toBeInTheDocument();
    expect(screen.getByText("␣strawberry")).toBeInTheDocument();
  }, 30000);
});
