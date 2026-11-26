import { describe, expect, it } from "vitest";
import recorded from "./data/generation-tree.json";
import {
  STAGES,
  choicesAt,
  coverage,
  initialLab,
  labStep,
  pickToken,
  type GenTree,
  type LabState,
} from "./generationLab";

/** A small hand-made tree: root → "a" (60%) or "b" (30%); "c" (10%) was never recorded. "a" → "x" then the model stops. */
const TREE: GenTree = {
  prompt: "Say",
  nodes: [
    { top: [["a", Math.log(0.6)], ["b", Math.log(0.3)], ["c", Math.log(0.1)]], children: { a: 1, b: 2 }, visits: 10, ends: 0 },
    { top: [["x", Math.log(0.9)], ["y", Math.log(0.1)]], children: { x: 3 }, visits: 6, ends: 0 },
    { top: null, children: {}, visits: 4, ends: 0 },
    { top: null, children: {}, visits: 6, ends: 6 },
  ],
};
const fixed = (r: number) => () => r;
const run = (s: LabState, n: number, opts = { temperature: 1, maxTokens: 12, rand: fixed(0) }) => {
  for (let i = 0; i < n; i++) s = labStep(s, TREE, opts);
  return s;
};

describe("choicesAt", () => {
  it("returns the real probabilities, which recorded branches exist, and temperature-adjusted shares", () => {
    const c = choicesAt(TREE, 0, 1);
    expect(c.map((x) => x.token)).toEqual(["a", "b", "c"]);
    expect(c.map((x) => x.recorded)).toEqual([true, true, false]);
    expect(c[0]!.raw).toBeCloseTo(0.6);
    expect(c.reduce((s, x) => s + x.adjusted, 0)).toBeCloseTo(1);
    expect(c[0]!.adjusted).toBeCloseTo(0.6);
  });

  it("sharpens below temperature 1, flattens above it, and is greedy at 0", () => {
    expect(choicesAt(TREE, 0, 0.5)[0]!.adjusted).toBeCloseTo(0.36 / (0.36 + 0.09 + 0.01));
    expect(choicesAt(TREE, 0, 2)[0]!.adjusted).toBeLessThan(0.6);
    expect(choicesAt(TREE, 0, 0).map((x) => x.adjusted)).toEqual([1, 0, 0]);
  });

  it("measures how much probability the recorded branches cover", () => {
    expect(coverage(TREE, 0)).toBeCloseTo(0.9);
  });
});

describe("the five-stage loop", () => {
  it("names the stages in order", () => {
    expect(STAGES.map((s) => s.title)).toEqual(["Feed context", "Score every token", "Choose one token", "Append to context", "Repeat or stop"]);
  });

  it("walks feed → score (one forward pass) → choose → append → repeat, one micro-step at a time", () => {
    let s = initialLab();
    expect(s.stage).toBe(0);
    s = run(s, 1);
    expect(s.stage).toBe(1);
    expect(s.forwardPasses).toBe(1);
    s = run(s, 1);
    expect(s.stage).toBe(2);
    expect(s.chosen).toBe("a");
    s = run(s, 1);
    expect(s.stage).toBe(3);
    expect(s.generated).toEqual(["a"]);
    s = run(s, 1);
    expect(s.stage).toBe(4);
    expect(s.stopped).toBeNull();
    s = run(s, 1);
    expect(s.stage).toBe(0);
    expect(s.node).toBe(1);
  });

  it("stops when the model ended its reply, and says so", () => {
    const s = run(initialLab(), 10);
    expect(s.generated).toEqual(["a", "x"]);
    expect(s.stopped).toBe("model-ended");
    expect(s.forwardPasses).toBe(2);
    expect(run(s, 3)).toEqual(s);
  });

  it("stops at the max-new-tokens limit", () => {
    const s = run(initialLab(), 10, { temperature: 1, maxTokens: 1, rand: fixed(0) });
    expect(s.generated).toEqual(["a"]);
    expect(s.stopped).toBe("max-tokens");
  });

  it("samples only among recorded branches, weighted by the adjusted probabilities", () => {
    expect(run(initialLab(), 2, { temperature: 1, maxTokens: 12, rand: fixed(0.65) }).chosen).toBe("a");
    expect(run(initialLab(), 2, { temperature: 1, maxTokens: 12, rand: fixed(0.7) }).chosen).toBe("b");
  });

  it("is greedy at temperature 0", () => {
    expect(run(initialLab(), 2, { temperature: 0, maxTokens: 12, rand: fixed(0.99) }).chosen).toBe("a");
  });

  it("lets the learner pick a recorded token at the choose stage, but not an unrecorded one", () => {
    const scored = run(initialLab(), 1);
    expect(pickToken(scored, TREE, "b").chosen).toBe("b");
    expect(pickToken(scored, TREE, "b").stage).toBe(2);
    expect(pickToken(scored, TREE, "c")).toBe(scored);
  });

  it("stops with 'not recorded' when a branch has no further data and the model did not end there", () => {
    const s = run(pickToken(run(initialLab(), 1), TREE, "b"), 5);
    expect(s.generated).toEqual(["b"]);
    expect(s.stopped).toBe("not-recorded");
  });
});

describe("the recorded gemma4 tree", () => {
  const data = recorded as unknown as { model: string; trees: GenTree[] };
  it("comes from gemma4 and covers four prompts", () => {
    expect(data.model).toBe("gemma4:12b");
    expect(data.trees.map((t) => t.prompt)).toEqual([
      "Once upon a time, there was a",
      "My favourite thing about weekends is",
      "The bank approved the",
      "The capital of France is",
    ]);
  });

  it("follows the greedy path to a real, finished reply", () => {
    const t = data.trees[0]!;
    let s = initialLab();
    for (let i = 0; i < 80 && !s.stopped; i++) s = labStep(s, t, { temperature: 0, maxTokens: 12, rand: fixed(0) });
    expect(s.generated.join("")).toBe("small village hidden deep within a forest.");
    expect(s.stopped).toBe("model-ended");
  });

  it("records a top-10 list that holds most of the probability at every node (the lab shows the exact share)", () => {
    for (const t of data.trees) for (const n of t.nodes) if (n.top) expect(n.top.reduce((s, [, lp]) => s + Math.exp(lp), 0)).toBeGreaterThan(0.85);
  });
});
