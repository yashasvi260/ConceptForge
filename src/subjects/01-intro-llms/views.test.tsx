import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import subject from ".";
import { Stage } from "./Stage";
import { steps } from "./steps";

/** Renders a view, including the second view of a step that offers several (steps list them in `views`). */
const renderStep = (view: string) => {
  const i = steps.findIndex((s) => s.view === view || s.views?.some((v) => v.view === view));
  return render(<Stage step={{ ...steps[i]!, view }} stepIndex={i} />);
};

describe("Module 01 content", () => {
  it("is a complete module: 12 steps, ≥ 6 hinted challenges, a bridge to Module 02", () => {
    expect(subject.moduleNumber).toBe(1);
    expect(steps).toHaveLength(12);
    expect(steps.map((s) => s.view)).toEqual(["loop-lab", "anatomy", "scale", "trainuse", "bow", "dense", "context", "arch", "encdec", "repgen", "training", "recap"]);
    expect(steps.slice(1, 4).map((s) => s.id)).toEqual(["anatomy", "how-large", "train-vs-use"]);
    for (const s of steps) {
      expect(s.tryIt, s.id).toBeTruthy();
      expect(s.keyTakeaway, s.id).toBeTruthy();
    }
    expect(subject.challenges.length).toBeGreaterThanOrEqual(6);
    expect(subject.challenges.every((c) => c.hint && c.relatedStepId)).toBe(true);
    expect(subject.bridge.leadsTo).toMatch(/Module 02/);
  });
});

describe("Module 01 views", () => {
  it("anatomy parts are clickable and each names the module that covers it", () => {
    renderStep("anatomy");
    const parts = screen.getAllByRole("button", { name: /^Part: / });
    expect(parts.length).toBeGreaterThanOrEqual(5);
    fireEvent.click(screen.getByRole("button", { name: /^Part: Embedding table/ }));
    expect(screen.getByRole("region", { name: "Selected part" })).toHaveTextContent(/Module 02/);
    fireEvent.click(screen.getByRole("button", { name: /^Part: Transformer blocks/ }));
    expect(screen.getByRole("region", { name: "Selected part" })).toHaveTextContent(/Module 03/);
  });

  it("scale view switches configs and shows the parameter breakdown", () => {
    renderStep("scale");
    expect(screen.getByText("124,439,808")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Llama 3 8B/ }));
    expect(screen.getByText("8,030,261,248")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Configuration" })).toHaveTextContent("14,336");
  });

  it("training vs using contrasts the two phases", () => {
    renderStep("trainuse");
    expect(screen.getByRole("region", { name: "Training" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Using (inference)" })).toBeInTheDocument();
  });

  it("map shows all four parts of the track", () => {
    renderStep("map");
    for (const part of ["Part I", "Part II", "Part III", "Part IV"]) expect(screen.getAllByText(new RegExp(part)).length).toBeGreaterThan(0);
  });

  it("bag-of-words shows a count table for the sentences", () => {
    renderStep("bow");
    const table = screen.getByRole("table", { name: "Word counts" });
    expect(within(table).getAllByRole("row").length).toBeGreaterThan(2);
  });

  it("dense view compares real embedding similarity with bag-of-words", async () => {
    renderStep("dense");
    const row = await screen.findByRole("row", { name: /film was great.*movie was excellent/i });
    await waitFor(() => expect(within(row).getByTestId("emb-sim")).toHaveTextContent(/0\.\d{2}/));
    const emb = Number(within(row).getByTestId("emb-sim").textContent);
    const bow = Number(within(row).getByTestId("bow-sim").textContent);
    expect(emb).toBeGreaterThan(bow);
  });

  it("architecture comparator changes which positions are visible", () => {
    renderStep("arch");
    const visible = () => screen.getAllByTestId("vis-cell").filter((c) => c.getAttribute("data-visible") === "true").length;
    fireEvent.click(screen.getByRole("radio", { name: /Encoder/ }));
    const encoder = visible();
    fireEvent.click(screen.getByRole("radio", { name: /Decoder/ }));
    expect(visible()).toBeLessThan(encoder);
  });

  it("training view switches between next-token and masked objectives", () => {
    renderStep("training");
    fireEvent.click(screen.getByRole("radio", { name: /BERT/ }));
    act(() => fireEvent.click(screen.getByRole("button", { name: /Mask again/ })));
    expect(screen.getAllByTestId("mlm-token").some((t) => t.getAttribute("data-predict") === "true")).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: /GPT/ }));
    expect(screen.getAllByTestId("ntp-pair").length).toBeGreaterThan(1);
  });
});
