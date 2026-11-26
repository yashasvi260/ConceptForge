import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MODEL_CONFIGS, paramBreakdown } from "../../../01-intro-llms/modelConfigs";
import { BlockParamsLab, LearnedPosLab, RopeRelativeLab, ShapesLab, ShuffleLab, blockParams } from "./ForwardPositionLabs";

describe("Module 03 forward-pass and position labs", () => {
  it("blockParams adds up to each model's exact published total", () => {
    for (const c of MODEL_CONFIGS) {
      const b = blockParams(c);
      const p = paramBreakdown(c);
      const finalNorm = c.family === "gpt2" ? 2 * c.dModel : c.dModel;
      expect(c.layers * (b.attention + b.ffn + b.norms) + finalNorm, c.name).toBe(p.layers);
    }
  });

  it("Shapes: GPT-2 small, 12 tokens → 12 heads × 12 × 12 attention weights", async () => {
    render(<ShapesLab />);
    expect(screen.getByRole("status")).toHaveTextContent("GPT-2 small, 12 tokens: attention weights (12, 12, 12) = 1,728 numbers per block; each block returns (12, 768)");
    await userEvent.click(screen.getByRole("radio", { name: "Llama 3 8B" }));
    fireEvent.change(screen.getByRole("slider", { name: /Tokens/ }), { target: { value: "100" } });
    expect(screen.getByRole("status")).toHaveTextContent("attention weights (32, 100, 100) = 320,000 numbers per block");
  });

  it("Block parameters: 80.8% of a Llama 3 8B block is feed-forward; without GQA attention grows", async () => {
    render(<BlockParamsLab />);
    expect(screen.getByRole("status")).toHaveTextContent("Llama 3 8B block: 218,112,000 parameters, 80.8% in the feed-forward network");
    await userEvent.click(screen.getByRole("switch", { name: /Grouped-query/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Llama 3 8B block: 243,277,824 parameters");
    await userEvent.click(screen.getByRole("radio", { name: "GPT-2 small" }));
    expect(screen.getByRole("status")).toHaveTextContent("GPT-2 small block: 7,087,872 parameters, 66.6% in the feed-forward network");
  });

  it("Shuffle: without positions outputs just move; with positions they change", async () => {
    render(<ShuffleLab />);
    const shuffle = screen.getByRole("button", { name: "Shuffle the tokens" });
    await userEvent.click(shuffle);
    expect(screen.getByRole("status")).toHaveTextContent("attention didn't notice the order");
    await userEvent.click(screen.getByRole("switch", { name: /positions/ }));
    expect(screen.getByRole("status")).toHaveTextContent("with positions added, order matters");
  });

  it("GPT-2 positions: 0.997 for neighbours, negative by distance 256", () => {
    render(<LearnedPosLab />);
    expect(screen.getByRole("status")).toHaveTextContent("Neighbours are almost identical (0.997); by distance 256 the similarity is negative (-0.446)");
  });

  it("RoPE: (5, 2) and (105, 102) give the same score", () => {
    render(<RopeRelativeLab />);
    expect(screen.getByRole("status")).toHaveTextContent("m − n = 3: score q·k = -0.1164");
    fireEvent.change(screen.getByRole("slider", { name: /Query position/ }), { target: { value: "105" } });
    fireEvent.change(screen.getByRole("slider", { name: /Key position/ }), { target: { value: "102" } });
    expect(screen.getByRole("status")).toHaveTextContent("m − n = 3: score q·k = -0.1164");
  });
});
