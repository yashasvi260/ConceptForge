import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GenTree } from "../generationLab";
import { GenerationLabView, type GenRecording } from "./GenerationLabView";

const TREE: GenTree = {
  prompt: "Say hi",
  nodes: [
    { top: [[" hello", Math.log(0.6)], [" hey", Math.log(0.3)], [" yo", Math.log(0.1)]], children: { " hello": 1, " hey": 2 }, visits: 10, ends: 0 },
    { top: [[".", Math.log(0.9)], ["!", Math.log(0.1)]], children: { ".": 3 }, visits: 6, ends: 0 },
    { top: null, children: {}, visits: 4, ends: 4 },
    { top: null, children: {}, visits: 6, ends: 6 },
  ],
};
const REC: GenRecording = { model: "gemma4:12b", recordedAt: "2026-11-26", system: "s", trees: [TREE, { ...TREE, prompt: "Other" }] };

async function setup() {
  render(<GenerationLabView load={() => Promise.resolve(REC)} rand={() => 0} />);
  await screen.findByText(/real probabilities from gemma4:12b/);
}
const next = () => userEvent.click(screen.getByRole("button", { name: /Next micro-step/ }));
const stage = () => screen.getByRole("list", { name: "The five stages" }).querySelector('[aria-current="step"]')!;

describe("GenerationLabView", () => {
  it("says the probabilities are real gemma4 recordings and starts at stage 1", async () => {
    await setup();
    expect(screen.getByText(/recorded 2026-11-26/)).toBeInTheDocument();
    expect(stage()).toHaveTextContent("Feed context");
    expect(within(screen.getByLabelText("Context window")).getByText("Say")).toBeInTheDocument();
  });

  it("runs a forward pass and shows real probabilities, fading branches no recorded reply took", async () => {
    await setup();
    await next();
    expect(stage()).toHaveTextContent("Score every token");
    expect(screen.getByText("Forward passes").nextSibling).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: "Pick ␣hello (60.0%)" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Pick ␣yo (10.0%)" })).toBeDisabled();
    expect(screen.getByText(/hold 90.0% of the probability/)).toBeInTheDocument();
  });

  it("lets the learner pick a token, then appends it to the context", async () => {
    await setup();
    await next();
    await userEvent.click(screen.getByRole("button", { name: "Pick ␣hey (30.0%)" }));
    expect(stage()).toHaveTextContent("Choose one token");
    await next();
    expect(within(screen.getByLabelText("Context window")).getByText("␣hey")).toBeInTheDocument();
    expect(screen.getByText("Generated tokens").nextSibling).toHaveTextContent("1");
  });

  it("runs whole tokens until the model ends its reply, and says why it stopped", async () => {
    await setup();
    const full = screen.getByRole("button", { name: /Full token/ });
    await userEvent.click(full);
    await userEvent.click(full);
    expect(screen.getByRole("status")).toHaveTextContent("gemma4 produced its end-of-turn token");
    expect(within(screen.getByLabelText("Context window")).getByText("end of turn")).toBeInTheDocument();
    expect(full).toBeDisabled();
  });

  it("keeps the last distribution on screen while appending and after the loop stops", async () => {
    await setup();
    const full = screen.getByRole("button", { name: /Full token/ });
    await userEvent.click(full);
    expect(screen.getByRole("button", { name: "Pick ␣hello (60.0%)" })).toBeDisabled();
    await userEvent.click(full);
    expect(screen.getByRole("button", { name: "Pick . (90.0%)" })).toBeInTheDocument();
    expect(screen.getByText(/The last forward pass/)).toBeInTheDocument();
  });

  it("re-weights the bars with temperature, and is greedy at 0", async () => {
    await setup();
    await next();
    const slider = screen.getByRole("slider", { name: "Temperature" });
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(slider, "0");
      slider.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(screen.getByRole("button", { name: "Pick ␣hello (100.0%)" })).toBeInTheDocument();
  });

  it("auto-runs to the end and resets", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await setup();
    await userEvent.click(screen.getByRole("button", { name: /Auto-run/ }));
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
    }
    expect(screen.getByRole("status")).toHaveTextContent("Loop stopped");
    await userEvent.click(screen.getByRole("button", { name: /Reset/ }));
    expect(screen.getByText("Forward passes").nextSibling).toHaveTextContent("0");
    vi.useRealTimers();
  });
});
