import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MODEL_CONFIGS, paramBreakdown } from "../../../01-intro-llms/modelConfigs";
import { BLOCK_OPS, BlockCheckLab, BlockTraceLab, WeightNamesLab } from "./RecapLabs";

describe("Module 03 recap labs", () => {
  it("the block's operations add up to GPT-2 small's per-block count", () => {
    const g = MODEL_CONFIGS.find((c) => c.id === "gpt2-small")!;
    const total = BLOCK_OPS.reduce((a, o) => a + o.params, 0);
    expect(total).toBe(7_087_872);
    expect(g.layers * total + 2 * g.dModel).toBe(paramBreakdown(g).layers);
  });

  it("Block trace: the last step reaches the block total", async () => {
    render(<BlockTraceLab />);
    expect(screen.getByRole("status")).toHaveTextContent("Step 1, LayerNorm 1: out (12, 768), 1,536 parameters (same shape, new numbers)");
    await userEvent.click(screen.getByRole("button", { name: /8\. add to the stream/ }));
    expect(screen.getByRole("status")).toHaveTextContent("7,087,872 of the block's 7,087,872 so far.");
  });

  it("Weight names: c_attn is 768 × 2,304", () => {
    render(<WeightNamesLab />);
    expect(screen.getByRole("status")).toHaveTextContent("h.0.attn.c_attn.weight (768 × 2,304): Q, K and V for all 12 heads in one product");
  });

  it("Real-model check: 3.9e-5 after all 12 blocks", () => {
    render(<BlockCheckLab />);
    expect(screen.getByRole("status")).toHaveTextContent("After all 12 blocks, the largest difference is 3.9e-5 on values up to 235.5");
  });
});
