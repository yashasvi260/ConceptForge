import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import * as m06 from "../../06-text-classification/model";
import { bagOfWords } from "../bow";
import { BaseToAssistantLab, DataPerStageLab, FinetuneFormatLab, ForgettingLab, TransferLab, afterThe, centroidAccuracy } from "./PretrainLabs";

const setSlider = (name: string, value: string) => {
  const s = screen.getByRole("slider", { name });
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(s, value);
    s.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

describe("pre-training and fine-tuning labs", () => {
  it("forgetting reproduces the worked example: 0.222 after one pass, 0.030 after twenty", () => {
    expect(afterThe(0, false).cat).toBeCloseTo(2 / 6);
    expect(afterThe(1, false).cat).toBeCloseTo(2 / 9);
    expect(afterThe(20, false).cat).toBeCloseTo(2 / 66);
    expect(afterThe(20, true).cat).toBeGreaterThan(afterThe(20, false).cat);
  });

  it("transfer: pre-trained vectors beat word counts at every size", () => {
    const { counts } = bagOfWords(m06.TICKETS.map((t) => t.text));
    const byId = new Map(m06.TICKETS.map((t, i) => [t.id, counts[i]!]));
    const rows = [1, 2, 4, 8].map((k) => [centroidAccuracy(m06, (id) => byId.get(id)!, k), centroidAccuracy(m06, m06.ticketVector, k)]);
    expect(rows.map((r) => r[1])).toEqual([12, 15, 16, 17]);
    for (const [bow, vec] of rows) expect(vec).toBeGreaterThan(bow!);
  });

  it("Fine-tuning format: masking the prompt keeps only the reply", async () => {
    render(<FinetuneFormatLab />);
    expect(screen.getByRole("status")).toHaveTextContent("only the reply");
    await userEvent.click(screen.getByRole("switch"));
    expect(screen.getByRole("status")).toHaveTextContent("also teaches the model to write user");
  });

  it("Transfer lab shows both accuracies", async () => {
    render(<TransferLab load={() => Promise.resolve(m06)} />);
    expect(await screen.findByText(/with pre-trained vectors/)).toHaveTextContent("15/20 with pre-trained vectors");
  });

  it("Forgetting lab: 20 passes turn it into a banking parrot", () => {
    render(<ForgettingLab />);
    setSlider("Passes over the banking text", "20");
    expect(screen.getByRole("status")).toHaveTextContent("3.0%");
    expect(screen.getByRole("status")).toHaveTextContent("banking parrot");
  });

  it("Data per stage: shows the verified InstructGPT figures on hover", () => {
    render(<DataPerStageLab />);
    expect(screen.getByTitle(/13,000 prompts with written answers \(Ouyang et al. 2022\)/)).toBeInTheDocument();
  });

  it("Base to assistant: preference stage shows a preferred and a rejected answer", async () => {
    render(<BaseToAssistantLab />);
    await userEvent.click(screen.getByRole("button", { name: "3. Preference tuning" }));
    expect(screen.getByText(/Rejected:/)).toBeInTheDocument();
  });
});
