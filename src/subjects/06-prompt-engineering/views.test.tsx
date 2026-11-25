import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import subject from ".";
import type { RecordingFile } from "../../llm/recordings";
import { OllamaProvider } from "../../llm/OllamaContext";
import experiment from "./data/recordings/experiment.json";
import small from "./data/recordings/experiment-small.json";
import { comboStats } from "./experiment";
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
const FILE = experiment as RecordingFile;
const SMALL = small as RecordingFile;
const off = { role: false, fewShot: false, cot: false, schema: false };

describe("Module 06 content", () => {
  it("is a complete module with bridges from 05 and to 07", () => {
    expect(subject.moduleNumber).toBe(6);
    expect(steps.length).toBeGreaterThanOrEqual(8);
    for (const s of steps) {
      expect(s.tryIt, s.id).toBeTruthy();
      expect(s.keyTakeaway, s.id).toBeTruthy();
    }
    expect(subject.challenges.length).toBeGreaterThanOrEqual(4);
    expect(subject.challenges.every((c) => c.hint && steps.some((s) => s.id === c.relatedStepId))).toBe(true);
    expect(subject.bridge.buildsOn).toMatch(/Module 0[45]/);
    expect(subject.bridge.leadsTo).toMatch(/Module 07/);
  });

  it("every combination was recorded for every ticket and sample", () => {
    expect(FILE.items).toHaveLength(16 * 8 * 4);
  });
});

describe("Module 06 views", () => {
  it("the intro names both recorded models", () => {
    renderStep("intro");
    expect(screen.getByText(/gemma4:12b/)).toHaveTextContent(/qwen2.5-coder:1.5b/);
  });

  it("prompt builder: toggling a component changes the prompt and the recorded numbers", async () => {
    renderStep("builder");
    const acc = await screen.findByTestId("combo-accuracy");
    const base = comboStats(FILE, off)!;
    expect(acc).toHaveTextContent(`${base.fieldsCorrect} / ${base.fieldsTotal}`);
    expect(screen.getByTestId("full-prompt")).not.toHaveTextContent(/step by step/);
    fireEvent.click(screen.getByRole("switch", { name: "Chain-of-thought" }));
    const cot = comboStats(FILE, { ...off, cot: true })!;
    await waitFor(() => expect(screen.getByTestId("combo-accuracy")).toHaveTextContent(`${cot.fieldsCorrect} / ${cot.fieldsTotal}`));
    expect(screen.getByTestId("full-prompt")).toHaveTextContent(/step by step/);
    expect(screen.getByTestId("combo-tokens")).toHaveTextContent(String(cot.promptTokens));
  });

  it("switching the model shows that model's recorded numbers", async () => {
    renderStep("builder");
    await screen.findByTestId("combo-accuracy");
    fireEvent.click(screen.getByRole("radio", { name: /qwen2.5-coder/ }));
    const smallStats = comboStats(SMALL, off)!;
    await waitFor(() => expect(screen.getByTestId("combo-accuracy")).toHaveTextContent(`${smallStats.fieldsCorrect} / ${smallStats.fieldsTotal}`));
  });

  it("prompt tokens are the selected ticket's count, labelled with the selected model", async () => {
    renderStep("builder");
    await screen.findByTestId("combo-accuracy");
    const rec = (id: string, f: RecordingFile) => f.items.find((i) => i.key === `r0f0c0s0:${id}:s0`)!;
    expect(screen.getByTestId("combo-tokens")).toHaveTextContent(String(rec("x1", FILE).promptEvalCount));
    fireEvent.change(screen.getByRole("combobox", { name: "Ticket" }), { target: { value: "x5" } });
    await waitFor(() => expect(screen.getByTestId("combo-tokens")).toHaveTextContent(String(rec("x5", FILE).promptEvalCount)));
    expect(screen.getByTestId("combo-tokens-label")).toHaveTextContent("gemma4:12b");
    fireEvent.click(screen.getByRole("radio", { name: /qwen2.5-coder/ }));
    await waitFor(() => expect(screen.getByTestId("combo-tokens-label")).toHaveTextContent("qwen2.5-coder:1.5b"));
    fireEvent.change(screen.getByRole("textbox", { name: "Ticket text" }), { target: { value: "edited ticket text" } });
    await waitFor(() => expect(screen.getByTestId("combo-tokens")).toHaveTextContent("–"));
  });

  it("editing the ticket text shows the no-recording note with a live option", async () => {
    renderStep("builder");
    const box = await screen.findByRole("textbox", { name: "Ticket text" });
    fireEvent.change(box, { target: { value: "My card is stuck in the machine, 20 dollars lost" } });
    expect(await screen.findByText(/No recording for this setting/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect my Ollama" })).toBeInTheDocument();
  });

  it("probability inspector lists alternatives for a clicked token", async () => {
    renderStep("inspector");
    const chips = await screen.findAllByTestId("token-chip");
    fireEvent.click(chips[Math.min(3, chips.length - 1)]!);
    const panel = screen.getByRole("region", { name: "Token alternatives" });
    expect(within(panel).getAllByTestId("alternative").length).toBeGreaterThan(0);
    expect(panel).toHaveTextContent(/%/);
  });

  it("chain step shows both recorded steps", async () => {
    renderStep("chain");
    expect(await screen.findByRole("region", { name: "Step 1: extract" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Step 2: reply" })).toHaveTextContent(/recorded from gemma4:12b/);
  });
});
