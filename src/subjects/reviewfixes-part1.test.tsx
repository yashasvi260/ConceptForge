/** Regression tests for the Part I final-review findings. */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fakeEmbedder } from "../test/fakeEmbedder";
import { steps as m01Steps } from "./01-intro-llms/steps";
import { Stage as M01Stage } from "./01-intro-llms/Stage";
import { steps as m02Steps } from "./02-tokens-embeddings/steps";
import { challenges as m02Challenges } from "./02-tokens-embeddings/challenges";
import { Stage as M02Stage } from "./02-tokens-embeddings/Stage";
import { steps as m03Steps } from "./03-transformer-internals/steps";
import { Stage as M03Stage } from "./03-transformer-internals/Stage";
import { NEXT } from "./03-transformer-internals/views/InternalsViews";
import { applySampling } from "./03-transformer-internals/sampling";

const text = (steps: { id: string; summary: string; body: string[]; keyTakeaway?: string; tryIt?: string }[], id: string) => {
  const s = steps.find((x) => x.id === id)!;
  return [s.summary, ...s.body, s.keyTakeaway, s.tryIt].join(" ");
};
/** Index of the step showing a view (merged deep steps list several views). */
const at = (steps: { view: string; views?: { view: string }[] }[], view: string) =>
  steps.findIndex((s) => s.view === view || s.views?.some((v) => v.view === view));

describe("F3: model run errors are shown, not swallowed", () => {
  it("shows an error instead of '…' forever", async () => {
    const spy = vi.spyOn(fakeEmbedder, "embedSentences").mockRejectedValue(new Error("wasm out of memory"));
    try {
      const i = at(m02Steps, "similarity");
      render(<M02Stage step={{ ...m02Steps[i]!, view: "similarity" }} stepIndex={i} />);
      expect(await screen.findByRole("alert")).toHaveTextContent(/went wrong running the model/i);
    } finally {
      spy.mockRestore();
    }
  });
});

describe("F5: long input gets a visible note", () => {
  it("similarity matrix warns when a line exceeds 256 word pieces", async () => {
    const i = at(m02Steps, "similarity");
    render(<M02Stage step={{ ...m02Steps[i]!, view: "similarity" }} stepIndex={i} />);
    act(() => fireEvent.change(screen.getByRole("textbox", { name: "Sentences" }), { target: { value: `short line\n${"word ".repeat(300)}` } }));
    expect(await screen.findByText(/reads only the first 256 word pieces/i)).toBeInTheDocument();
  });
});

describe("F6: the review demo never shows a verdict for old text", () => {
  it("clearing the review removes the verdict", async () => {
    const i = at(m01Steps, "repgen");
    render(<M01Stage step={m01Steps[i]!} stepIndex={i} />);
    expect(await screen.findByText(/Closest description/)).toBeInTheDocument();
    act(() => fireEvent.change(screen.getByRole("textbox", { name: "Review" }), { target: { value: "" } }));
    await waitFor(() => expect(screen.queryByText(/Closest description/)).not.toBeInTheDocument());
  });
});

describe("F4 + copy accuracy", () => {
  it("mean-pooling step says the [CLS]/[SEP] markers are averaged too", () => {
    expect(text(m02Steps, "sentence-embeddings")).toMatch(/\[CLS\]/);
  });

  it("F8: semantic search copy doesn't claim the texts share no words", () => {
    expect(text(m02Steps, "cheat-sheet")).not.toMatch(/no document contains those words/);
    expect(m02Challenges.find((c) => c.id === "emb-search")!.prompt).not.toMatch(/share no words/);
  });

  it("F9: no stale 'the topic after this one' reference", () => {
    expect(text(m02Steps, "vocabulary")).not.toMatch(/the topic after this one/);
  });

  it("F15: unsupported claims are softened", () => {
    expect(text(m01Steps, "dense-embeddings")).not.toMatch(/because averaging token vectors/);
    expect(text(m03Steps, "positional")).not.toMatch(/helps models generalise across positions/);
    expect(text(m03Steps, "self-attention")).not.toMatch(/which is how the contextual vectors in Module 02 came to differ/);
  });

  it("F12: the loading note counts the engine too (~30 MB)", async () => {
    const i = at(m02Steps, "similarity");
    const pending = vi.spyOn(fakeEmbedder, "embedSentences");
    render(<M02Stage step={{ ...m02Steps[i]!, view: "similarity" }} stepIndex={i} />);
    pending.mockRestore();
    const { ModelStatus } = await import("../ml/ModelStatus");
    render(<ModelStatus state={{ status: "loading", progress: 10, embedder: null, retry: () => {} }}>x</ModelStatus>);
    expect(screen.getByRole("status")).toHaveTextContent(/about 30 MB/);
  });
});

describe("F16 + F19: modules agree with each other", () => {
  it("Module 01's illustrative probabilities match Module 03's computation", () => {
    const i = at(m01Steps, "map");
    render(<M01Stage step={m01Steps[i]!} stepIndex={i} />);
    const top = applySampling(NEXT, { temperature: 1, topK: 0, topP: 1 })[0]!;
    expect(screen.getByText(new RegExp(`mat ${Math.round(top.finalProb * 100)}%`))).toBeInTheDocument();
  });

  it("Module 03's forward diagram shows pre-norm order, like its formula", () => {
    const i = at(m03Steps, "forward");
    render(<M03Stage step={m03Steps[i]!} stepIndex={i} />);
    expect(screen.getByRole("button", { name: /Norm → attention/ })).toBeInTheDocument();
  });
});
