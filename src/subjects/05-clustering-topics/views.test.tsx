import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import subject from ".";
import { OllamaProvider } from "../../llm/OllamaContext";
import data from "./data/docs.json";
import clusters from "./data/default-clusters.json";
import layoutFile from "./data/default-layout.json";
import { DEFAULTS, cluster } from "./pipeline";
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
const slider = (name: RegExp) => screen.getByRole("slider", { name });

describe("Module 05 content", () => {
  it("is a complete module with bridges from 04 and to 06", () => {
    expect(subject.moduleNumber).toBe(5);
    expect(steps.length).toBeGreaterThanOrEqual(8);
    for (const s of steps) {
      expect(s.tryIt, s.id).toBeTruthy();
      expect(s.keyTakeaway, s.id).toBeTruthy();
    }
    expect(subject.challenges.length).toBeGreaterThanOrEqual(4);
    expect(subject.challenges.every((c) => c.hint && steps.some((s) => s.id === c.relatedStepId))).toBe(true);
    expect(subject.bridge.buildsOn).toMatch(/Module 04/);
    expect(subject.bridge.leadsTo).toMatch(/Module 06/);
  });

  it("default clusters fixture matches the pipeline on the shipped layout", () => {
    const c = cluster(layoutFile.xy as [number, number][], data.docs.map((d) => d.text), DEFAULTS);
    expect(c.clusters).toBe(clusters.groups.length);
  });
});

describe("Module 05 views", () => {
  it("scatter renders one point per doc", () => {
    renderStep("umap");
    expect(within(screen.getByRole("img", { name: "Document map" })).getAllByTestId("doc-point")).toHaveLength(data.docs.length);
  });

  it("moving min_cluster_size changes the cluster count", async () => {
    renderStep("hdbscan");
    const count = () => screen.getByTestId("cluster-count").textContent;
    expect(count()).toBe(String(clusters.groups.length));
    fireEvent.change(slider(/min_cluster_size/), { target: { value: "15" } });
    await waitFor(() => expect(count()).not.toBe(String(clusters.groups.length)));
  });

  it("outlier threshold changes how many points are grey", async () => {
    renderStep("hdbscan");
    const n = () => Number(screen.getByTestId("outlier-count").textContent);
    const before = n();
    fireEvent.change(slider(/Outlier threshold/), { target: { value: "0.2" } });
    await waitFor(() => expect(n()).toBeGreaterThan(before));
  });

  it("default clustering shows recorded topic names with provenance", () => {
    renderStep("names");
    expect(screen.getByText("Mobile App Issues")).toBeInTheDocument();
    expect(screen.getAllByText(/^recorded from gemma4:12b · temperature 0/).length).toBeGreaterThan(0);
  });

  it("adding a document re-runs the pipeline; topic names then have no recording", async () => {
    renderStep("names");
    await userEvent.type(await screen.findByRole("textbox", { name: "Add a comment" }), "The cash machine ate my card");
    await userEvent.click(screen.getByRole("button", { name: "Add to the map" }));
    await waitFor(() => expect(screen.getAllByText(/No recording for this setting/).length).toBeGreaterThan(0), { timeout: 15000 });
    expect(screen.getByTestId("doc-total")).toHaveTextContent(String(data.docs.length + 1));
  });

  it("keywords step lists c-TF-IDF words per cluster", () => {
    renderStep("keywords");
    expect(screen.getAllByTestId("keyword-row").length).toBe(clusters.groups.length);
    expect(screen.getByText("mortgage")).toBeInTheDocument();
  });
});
