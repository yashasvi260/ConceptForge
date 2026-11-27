import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FfnActiveLab, FfnShapesLab, PrePostLab, ResidualDepthLab, StreamNormsLab, SwigluParamsLab, depthSignal } from "./NormFfnLabs";

describe("Module 03 residual, norm and feed-forward labs", () => {
  it("Residual stream: 'The' grows 308× then the final LayerNorm brings it to 78.1", async () => {
    render(<StreamNormsLab />);
    expect(screen.getByRole("status")).toHaveTextContent('"The": 10.1 → 3112.4 after block 11 (308×), then 78.1 after the final LayerNorm.');
    await userEvent.click(screen.getByRole("button", { name: "Token 1: bank" }));
    expect(screen.getByRole("status")).toHaveTextContent('" bank": 6.1 → 236.0 after block 11');
  });

  it("Depth: the plain stack loses the signal, the residual stack keeps far more", () => {
    const s = depthSignal(0.7, 24);
    expect(s.plain).toBeCloseTo(0.7 ** 24);
    expect(s.residual).toBeGreaterThan(1000 * s.plain);
    render(<ResidualDepthLab />);
    expect(screen.getByRole("status")).toHaveTextContent("24 layers, slope 0.70: without residuals the signal is 1.92e-4 of where it started; with residuals 0.481.");
  });

  it("Pre/post: pre-norm never normalises the stream until the end", async () => {
    render(<PrePostLab />);
    expect(screen.getByRole("status")).toHaveTextContent("the stream itself is never normalised until the final norm");
    await userEvent.click(screen.getByRole("radio", { name: /post-norm/ }));
    expect(screen.getByRole("status")).toHaveTextContent("the stream itself is normalised after every sub-layer");
  });

  it("FFN shapes: GPT-2 small 768 → 3,072 → 768; Llama 3 8B has three matrices", async () => {
    render(<FfnShapesLab />);
    expect(screen.getByRole("status")).toHaveTextContent("GPT-2 small: 768 → 3,072 (4.00×) → 768, 2 matrices, 4,718,592 weights per block.");
    await userEvent.click(screen.getByRole("radio", { name: "Llama 3 8B" }));
    expect(screen.getByRole("status")).toHaveTextContent("Llama 3 8B: 4,096 → 14,336 (3.50×) → 4,096, 3 matrices, 176,160,768 weights per block.");
  });

  it("Active units: 6.9%–13.7% above 0.1 in every block", () => {
    render(<FfnActiveLab />);
    expect(screen.getByRole("status")).toHaveTextContent("only 6.9%–13.7% of the values after GELU are above 0.1");
  });

  it("SwiGLU width: Llama 3 8B's 14,336 is 1.3125× a 4× GELU network", () => {
    render(<SwigluParamsLab />);
    expect(screen.getByRole("status")).toHaveTextContent("f = 14,336: SwiGLU 176,160,768 vs 4× GELU 134,217,728 (1.3125×)");
    fireEvent.change(screen.getByRole("slider", { name: /hidden width/ }), { target: { value: "10923" } });
    expect(screen.getByRole("status")).toHaveTextContent("(1.0000×)");
  });
});
