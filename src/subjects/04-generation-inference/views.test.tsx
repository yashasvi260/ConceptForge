import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../App";
import subject from ".";
import { Stage } from "./Stage";
import { steps } from "./steps";

const VIEWS = ["logits", "sampling", "kvcache", "recap"];
const renderStep = (view: string) => {
  const i = steps.findIndex((s) => s.view === view);
  return render(<Stage step={steps[i]!} stepIndex={i} />);
};

describe("Module 04 content", () => {
  it("is Module 4 with the logits, decoding and KV-cache steps moved from Module 03, and hinted challenges", () => {
    expect(subject.moduleNumber).toBe(4);
    expect(steps.map((s) => s.view)).toEqual(VIEWS);
    for (const s of steps) {
      expect(s.tryIt, s.id).toBeTruthy();
      expect(s.keyTakeaway, s.id).toBeTruthy();
    }
    expect(subject.challenges.length).toBeGreaterThanOrEqual(6);
    expect(subject.challenges.every((c) => c.hint && c.relatedStepId && steps.some((s) => s.id === c.relatedStepId))).toBe(true);
  });

  it("ends with an up-next card pointing to the next module", () => {
    window.location.hash = `#/04-generation-inference/${steps.length}`;
    render(<App />);
    expect(screen.getByRole("note", { name: "Up next" })).toHaveTextContent(/Module 0[56]/);
  });
});

describe("Module 04 views", () => {
  it("sampling sliders change the probability bars", () => {
    renderStep("sampling");
    const bars = () => within(screen.getByTestId("sampling-bars")).getAllByText(/%|cut/).map((e) => e.textContent).join(",");
    const before = bars();
    fireEvent.change(screen.getByRole("slider", { name: "Temperature" }), { target: { value: "2" } });
    expect(bars()).not.toBe(before);
    fireEvent.change(screen.getByRole("slider", { name: "Top-K" }), { target: { value: "1" } });
    expect(bars()).toMatch(/cut/);
  });

  it("KV cache toggle changes the totals", () => {
    renderStep("kvcache");
    const total = () => screen.getByTestId("kv-dots").textContent;
    const on = total();
    fireEvent.click(screen.getByRole("switch", { name: "KV cache" }));
    expect(total()).not.toBe(on);
  });

  it("logits view is labelled illustrative", () => {
    renderStep("logits");
    expect(screen.getAllByText(/illustrative/i).length).toBeGreaterThan(0);
  });

});
