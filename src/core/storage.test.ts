import { describe, expect, it } from "vitest";
import {
  PROGRESS_KEY,
  getProgress,
  loadProgress,
  saveProgress,
  withChallengeResult,
  withStepVisited,
  withSubjectReset,
} from "./storage";

describe("storage", () => {
  it("round-trips progress through localStorage", () => {
    let map = withStepVisited({}, "transformers", 2, "qkv");
    map = withChallengeResult(map, "transformers", 5, 7);
    saveProgress(map);
    const loaded = loadProgress();
    expect(getProgress(loaded, "transformers")).toEqual({
      lastStep: 2,
      visitedSteps: ["qkv"],
      bestScore: { correct: 5, total: 7 },
      lastScore: { correct: 5, total: 7 },
      attempts: 1,
    });
  });

  it("keeps the best score but records the latest one", () => {
    let map = withChallengeResult({}, "s", 6, 7);
    map = withChallengeResult(map, "s", 2, 7);
    expect(getProgress(map, "s").bestScore).toEqual({ correct: 6, total: 7 });
    expect(getProgress(map, "s").lastScore).toEqual({ correct: 2, total: 7 });
    expect(getProgress(map, "s").attempts).toBe(2);
  });

  it("does not duplicate visited steps and returns the same map when nothing changed", () => {
    const a = withStepVisited({}, "s", 1, "x");
    const b = withStepVisited(a, "s", 1, "x");
    expect(b).toBe(a);
    expect(getProgress(b, "s").visitedSteps).toEqual(["x"]);
  });

  it("survives corrupt or hostile stored data", () => {
    window.localStorage.setItem(PROGRESS_KEY, "{not json");
    expect(loadProgress()).toEqual({});
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify({ s: { lastStep: -4, visitedSteps: [1, "ok"], bestScore: "x" } }));
    expect(getProgress(loadProgress(), "s")).toMatchObject({ lastStep: 0, visitedSteps: ["ok"], bestScore: null });
  });

  it("resets one subject without touching others", () => {
    const map = withStepVisited(withStepVisited({}, "a", 1, "x"), "b", 2, "y");
    const reset = withSubjectReset(map, "a");
    expect(reset.a).toBeUndefined();
    expect(reset.b).toBeDefined();
  });
});
