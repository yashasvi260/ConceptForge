import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { LessonStep } from "../core/types";
import { StepControls } from "./StepControls";

const step = (id: string, section?: string): LessonStep => ({ id, title: id, summary: "", body: ["x"], view: id, section });
const steps = [step("a", "Tokens"), step("b", "Tokens"), step("c", "Embeddings")];
const base = { steps, accent: "sky" as const, autoPlay: false, autoPlayMs: 1000, visited: [], onChange: vi.fn(), onToggleAutoPlay: vi.fn(), onFinishSteps: vi.fn() };

describe("StepControls", () => {
  it("groups the step scrubber by section", () => {
    render(<StepControls {...base} index={0} />);
    expect(within(screen.getByRole("group", { name: "Tokens" })).getAllByRole("button")).toHaveLength(2);
    expect(within(screen.getByRole("group", { name: "Embeddings" })).getAllByRole("button")).toHaveLength(1);
  });

  it("fills segments up to the current step", () => {
    render(<StepControls {...base} index={1} />);
    const filled = (name: string) => screen.getByRole("button", { name }).dataset.filled;
    expect(filled("Go to step 1: a")).toBe("true");
    expect(filled("Go to step 2: b")).toBe("true");
    expect(filled("Go to step 3: c")).toBe("false");
  });

  it("last step shows Take Practice Check", async () => {
    const onFinishSteps = vi.fn();
    render(<StepControls {...base} index={2} onFinishSteps={onFinishSteps} />);
    expect(screen.queryByRole("button", { name: "Next step" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Take Practice Check ✓" }));
    expect(onFinishSteps).toHaveBeenCalled();
  });

  it("marks steps whose exercise is passed", () => {
    render(<StepControls {...base} index={0} passedSteps={["b"]} />);
    expect(screen.getByRole("button", { name: "Go to step 2: b" })).toHaveAttribute("data-passed", "true");
    expect(screen.getByRole("button", { name: "Go to step 1: a" })).not.toHaveAttribute("data-passed");
  });

  it("can hide Auto-Play", () => {
    render(<StepControls {...base} index={0} showAutoPlay={false} />);
    expect(screen.queryByRole("button", { name: "Start auto-play" })).toBeNull();
    expect(screen.queryByText("auto-play")).toBeNull();
  });
});
