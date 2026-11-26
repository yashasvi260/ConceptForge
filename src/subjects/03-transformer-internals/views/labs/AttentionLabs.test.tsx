import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AttnCostLab, HeadFinderLab, QkvProjectLab, RealHeadsLab, SqrtDLab, ValueMixLab, attnTableBytes, simulateScores } from "./AttentionLabs";

describe("Module 03 attention labs", () => {
  it("Q, K, V: the query of 'approved' gives the worked example's weights", () => {
    render(<QkvProjectLab />);
    expect(screen.getByRole("status")).toHaveTextContent("weights 0.278 / 0.324 / 0.398 to the, bank, approved");
  });

  it("√d: raw scores spread like √d; scaling brings the spread to about 1 and loosens the softmax", () => {
    for (const d of [4, 16, 64, 256]) {
      const raw = simulateScores(d, false);
      const sc = simulateScores(d, true);
      expect(raw.std / Math.sqrt(d), `d=${d}`).toBeGreaterThan(0.9);
      expect(raw.std / Math.sqrt(d), `d=${d}`).toBeLessThan(1.1);
      expect(Math.abs(sc.std - 1)).toBeLessThan(0.1);
      if (d >= 16) expect(raw.top).toBeGreaterThan(sc.top + 0.3);
    }
    render(<SqrtDLab />);
    expect(screen.getByRole("status")).toHaveTextContent(/d = 64, raw: scores spread [78]\.\d/);
  });

  it("Mixing values: very sharp scores copy the first value", () => {
    render(<ValueMixLab />);
    fireEvent.change(screen.getByRole("slider", { name: /sharpness/ }), { target: { value: "10" } });
    expect(screen.getByRole("status")).toHaveTextContent(/Weights 0\.99\d/);
  });

  it("Real heads: layer 4 head 11 sends ' income' to ' steady'; layer 5 head 1 to 'The'", () => {
    render(<RealHeadsLab />);
    expect(screen.getByRole("status")).toHaveTextContent('Layer 4, head 11: " income" puts 100% on " steady".');
    fireEvent.change(screen.getByRole("slider", { name: "Layer" }), { target: { value: "5" } });
    fireEvent.change(screen.getByRole("slider", { name: "Head" }), { target: { value: "1" } });
    expect(screen.getByRole("status")).toHaveTextContent('Layer 5, head 1: " income" puts 100% on "The".');
  });

  it("Head finder: the strongest previous-token head is layer 4, head 11", async () => {
    render(<HeadFinderLab />);
    expect(screen.getByRole("status")).toHaveTextContent("Strongest previous-token head: layer 4, head 11 (0.997).");
    await userEvent.click(screen.getByRole("radio", { name: "first token" }));
    expect(screen.getByRole("status")).toHaveTextContent("Strongest first-token head: layer 5, head 1 (0.996).");
  });

  it("Attention cost: GPT-2, 1,024 tokens → 25.2 MB per layer; quadruples when n doubles", () => {
    expect(attnTableBytes(12, 2048)).toBe(4 * attnTableBytes(12, 1024));
    render(<AttnCostLab />);
    expect(screen.getByRole("status")).toHaveTextContent("n = 1,024: 12 heads × 1,048,576 weights = 25.2 MB per layer");
  });
});
