import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import subject from ".";
import { OllamaProvider } from "../../llm/OllamaContext";
import { Stage } from "./Stage";
import { steps } from "./steps";

const renderStep = (view: string) => {
  const i = steps.findIndex((s) => s.view === view);
  expect(i, view).toBeGreaterThanOrEqual(0);
  return render(
    <OllamaProvider>
      <Stage step={steps[i]!} stepIndex={i} />
    </OllamaProvider>,
  );
};

describe("Module 06 content", () => {
  it("is a complete module with bridges from Part I and to 07", () => {
    expect(subject.id).toBe("06-text-classification");
    expect(subject.moduleNumber).toBe(6);
    expect(subject.part).toBe(2);
    expect(steps.length).toBeGreaterThanOrEqual(8);
    for (const s of steps) {
      expect(s.tryIt, s.id).toBeTruthy();
      expect(s.keyTakeaway, s.id).toBeTruthy();
    }
    expect(subject.challenges.length).toBeGreaterThanOrEqual(4);
    expect(subject.challenges.every((c) => c.hint && c.relatedStepId && steps.some((s) => s.id === c.relatedStepId))).toBe(true);
    expect(subject.bridge.buildsOn).toMatch(/Module 0[123]/);
    expect(subject.bridge.leadsTo).toMatch(/Module 07/);
  });
});

describe("Module 04 views", () => {
  it("training the head shows a falling loss curve and test accuracy", async () => {
    renderStep("train");
    await userEvent.click(screen.getByRole("button", { name: "Train the head" }));
    expect(await screen.findByRole("img", { name: "Training loss" })).toBeInTheDocument();
    expect(screen.getByTestId("head-accuracy")).toHaveTextContent(/\d+ \/ 20/);
    expect(screen.getByRole("table", { name: "Confusion matrix" })).toBeInTheDocument();
  });

  it("generative step shows the recorded gemma4 answer with its provenance and confidence", () => {
    renderStep("generative");
    expect(screen.getByText(/^recorded from gemma4:12b · temperature 0/)).toBeInTheDocument();
    expect(screen.getByTestId("gen-confidence")).toHaveTextContent(/%/);
  });

  it("comparator shows three verdicts for a test ticket", async () => {
    renderStep("compare");
    for (const name of ["Classifier head", "Zero-shot", "Generative (gemma4)"]) {
      expect(await screen.findByRole("region", { name })).toBeInTheDocument();
    }
    expect(within(screen.getByRole("region", { name: "Generative (gemma4)" })).getByText(/recorded from gemma4:12b/)).toBeInTheDocument();
  });

  it("a ticket you type gets live head and zero-shot verdicts, but no recorded generative answer", async () => {
    renderStep("compare");
    const box = screen.getByRole("textbox", { name: "Your own ticket" });
    await userEvent.type(box, "My card keeps getting rejected online");
    await userEvent.click(screen.getByRole("button", { name: "Classify my ticket" }));
    await waitFor(() => expect(within(screen.getByRole("region", { name: "Classifier head" })).getByTestId("verdict")).toHaveTextContent(/card|transfer|fraud|account|loan/));
    expect(within(screen.getByRole("region", { name: "Generative (gemma4)" })).getByText(/No recording for this setting/)).toBeInTheDocument();
  });

  it("editing a label description re-runs zero-shot", async () => {
    renderStep("zeroshot");
    const before = await screen.findByTestId("zs-score-card");
    const was = before.textContent;
    const field = screen.getByRole("textbox", { name: "Description for card" });
    fireEvent.change(field, { target: { value: "weather forecasts and holidays" } });
    await waitFor(() => expect(screen.getByTestId("zs-score-card").textContent).not.toBe(was));
  });
});
