import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LessonStep } from "../core/types";
import { StepControls } from "./StepControls";

const step = (id: string, section?: string): LessonStep => ({ id, title: id, summary: "", body: ["x"], view: id, section });

describe("StepControls", () => {
  it("groups the step scrubber by section", () => {
    const steps = [step("a", "Tokens"), step("b", "Tokens"), step("c", "Embeddings")];
    render(
      <StepControls steps={steps} index={0} accent="sky" autoPlay={false} autoPlayMs={1000} visited={[]} onChange={vi.fn()} onToggleAutoPlay={vi.fn()} />,
    );
    expect(within(screen.getByRole("group", { name: "Tokens" })).getAllByRole("button")).toHaveLength(2);
    expect(within(screen.getByRole("group", { name: "Embeddings" })).getAllByRole("button")).toHaveLength(1);
  });
});
