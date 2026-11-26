import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import recorded from "../data/generation-tree.json";
import type { GenRecording } from "./labkit";
import { ComputeLab, FrozenLab, GradientLab, LossLab, gdStep } from "./TrainUseLabs";

const load = () => Promise.resolve(recorded as unknown as GenRecording);
const setSlider = (name: string, value: string) => {
  const s = screen.getByRole("slider", { name });
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(s, value);
    s.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

describe("train-vs-use labs", () => {
  it("gdStep reproduces the worked example's first step", () => {
    expect(gdStep(1, 0.05)).toEqual({ pred: 2, loss: 16, grad: -16, next: 1.8 });
  });

  it("Loss: −ln p for the slider and for gemma4's real predictions", async () => {
    render(<LossLab load={load} />);
    expect(await screen.findByText("loss 0.063")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("0.693");
    expect(screen.getByText("loss 0.063")).toBeInTheDocument();
  });

  it("Gradient descent: learns at 0.05 and blows up at 0.3", async () => {
    render(<GradientLab />);
    await userEvent.click(screen.getByRole("button", { name: /One step/ }));
    expect(screen.getByRole("status")).toHaveTextContent("w = 1.8000");
    setSlider("Learning rate", "0.3");
    for (let i = 0; i < 4; i++) await userEvent.click(screen.getByRole("button", { name: /Ten steps/ }));
    expect(screen.getByRole("status")).toHaveTextContent("blew up");
  });

  it("Frozen weights: greedy gives five identical replies", async () => {
    render(<FrozenLab load={load} rand={() => 0.5} />);
    await screen.findByRole("list", { name: "First-token probabilities (identical every run)" });
    setSlider("Temperature", "0");
    await userEvent.click(screen.getByRole("button", { name: /Generate 5 replies/ }));
    const replies = within(screen.getByRole("list", { name: "Five replies" })).getAllByRole("listitem");
    expect(replies.map((r) => r.textContent)).toEqual(Array(5).fill("small village hidden deep within a forest."));
    expect(screen.getByRole("status")).toHaveTextContent("All five identical");
  });

  it("Compute: shows Llama 3 8B's training FLOPs", () => {
    render(<ComputeLab />);
    expect(screen.getByText(/7\.2\de\+23 FLOPs/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("inference matches the training compute after");
  });
});
