import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CrossAttentionLab, DecoderOnlyLab, EncDecCostLab, T5RunLab, TeacherForcingLab, TwoStacksLab, crossAttention } from "./EncDecLabs";

describe("encoder-decoder labs", () => {
  it("cross-attention reproduces the worked example", () => {
    const r = crossAttention([0.2, 1], false);
    expect(r.w.map((x) => Number(x.toFixed(3)))).toEqual([0.245, 0.431, 0.325]);
    expect(r.mixed.map((x) => Number(x.toFixed(3)))).toEqual([0.407, 0.593]);
  });

  it("Two stacks: one encoder run, one decoder run per word", async () => {
    render(<TwoStacksLab />);
    for (let i = 0; i < 3; i++) await userEvent.click(screen.getByRole("button", { name: /Write the next word/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Encoder runs: 1 · decoder runs: 3");
  });

  it("Cross-attention: a causal mask on the input hides sleeps", async () => {
    render(<CrossAttentionLab />);
    expect(screen.getByRole("status")).toHaveTextContent("(0.407, 0.593)");
    await userEvent.click(screen.getByRole("switch"));
    expect(screen.getByRole("status")).toHaveTextContent("sleeps is now invisible");
  });

  it("Teacher forcing: a generation mistake becomes later input", async () => {
    render(<TeacherForcingLab />);
    await userEvent.click(screen.getByRole("switch", { name: /Generating/ }));
    await userEvent.click(screen.getByRole("switch", { name: /got word 2 wrong/ }));
    expect(screen.getByRole("status")).toHaveTextContent("becomes input for every later step");
  });

  it("Cost: shows the comparisons for 1,000 in and 100 out", () => {
    render(<EncDecCostLab />);
    expect(screen.getByText("1,000,000")).toBeInTheDocument();
    expect(screen.getByText("100,000")).toBeInTheDocument();
  });

  it("Decoder-only: the input is visible while writing", () => {
    render(<DecoderOnlyLab />);
    expect(screen.getByRole("status")).toHaveTextContent("sleeps");
  });

  it("T5 run: shows the real captured output and its mistake", () => {
    render(<T5RunLab />);
    expect(screen.getByLabelText("Captured output")).toHaveTextContent("60,506,624");
    expect(screen.getByLabelText("Captured output")).toHaveTextContent("Le chat dorme.");
  });
});
