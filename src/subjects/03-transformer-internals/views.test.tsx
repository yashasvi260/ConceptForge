import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../App";
import subject from ".";
import { Stage } from "./Stage";
import { steps } from "./steps";

const VIEWS = ["forward", "positional", "qkv", "attention", "multihead", "gqa", "norm", "ffn", "logits", "sampling", "kvcache", "recap"];
const renderStep = (view: string) => {
  const i = steps.findIndex((s) => s.view === view);
  return render(<Stage step={steps[i]!} stepIndex={i} />);
};

describe("Module 03 content", () => {
  it("has 12 steps in order, ≥ 6 hinted challenges and a bridge", () => {
    expect(subject.moduleNumber).toBe(3);
    expect(steps.map((s) => s.view)).toEqual(VIEWS);
    for (const s of steps) {
      expect(s.tryIt, s.id).toBeTruthy();
      expect(s.keyTakeaway, s.id).toBeTruthy();
    }
    expect(subject.challenges.length).toBeGreaterThanOrEqual(6);
    expect(subject.challenges.every((c) => c.hint && c.relatedStepId)).toBe(true);
  });

  it("ends with an up-next card pointing to Module 04 (coming soon)", () => {
    window.location.hash = `#/03-transformer-internals/${steps.length}`;
    render(<App />);
    expect(screen.getByRole("note", { name: "Up next" })).toHaveTextContent(/Module 04: Text Classification \(coming soon\)/);
  });
});

describe("Module 03 views", () => {
  it("attention: clicking a token moves the arcs; head selector changes the heatmap; illustrative label shown", () => {
    renderStep("attention");
    expect(screen.getAllByText(/illustrative/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Focus token loan" }));
    expect(screen.getByRole("img", { name: /Attention from "loan"/ })).toBeInTheDocument();
    const heat = () => screen.getAllByTestId("heat-cell").map((c) => c.getAttribute("title")).join("|");
    const before = heat();
    fireEvent.click(screen.getByRole("radio", { name: "H1" }));
    expect(heat()).not.toBe(before);
  });

  it("causal mask toggle zeroes the upper triangle", () => {
    renderStep("attention");
    const upper = () =>
      screen.getAllByTestId("heat-cell").filter((c) => c.getAttribute("data-upper") === "true").map((c) => Number(c.getAttribute("data-p")));
    expect(upper().every((p) => p === 0)).toBe(true);
    fireEvent.click(screen.getByRole("switch", { name: "Causal mask" }));
    expect(upper().some((p) => p > 0)).toBe(true);
  });

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

  it("GQA view: fewer KV heads means less cache memory", () => {
    renderStep("gqa");
    const mem = () => screen.getByTestId("gqa-memory").textContent;
    const full = mem();
    fireEvent.click(screen.getByRole("radio", { name: /8 KV heads/ }));
    expect(mem()).not.toBe(full);
  });

  it("logits view is labelled illustrative", () => {
    renderStep("logits");
    expect(screen.getAllByText(/illustrative/i).length).toBeGreaterThan(0);
  });
});
