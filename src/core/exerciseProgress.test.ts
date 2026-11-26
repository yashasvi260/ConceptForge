import { beforeEach, describe, expect, it } from "vitest";
import { EXERCISE_KEY, isExercisePassed, loadExerciseProgress, markPartPassed } from "./exerciseProgress";
import type { Exercise } from "./types";

const EX: Exercise = {
  id: "ex",
  title: "Ex",
  packages: [],
  parts: [
    { id: "p1", prompt: "", starter: "", solution: "", checks: "", hints: [] },
    { id: "p2", prompt: "", starter: "", solution: "", checks: "", hints: [] },
  ],
};

beforeEach(() => window.localStorage.clear());

describe("exercise progress", () => {
  it("starts empty and survives corrupt storage", () => {
    expect(loadExerciseProgress()).toEqual({});
    window.localStorage.setItem(EXERCISE_KEY, "{not json");
    expect(loadExerciseProgress()).toEqual({});
    window.localStorage.setItem(EXERCISE_KEY, JSON.stringify({ ex: "nope", ok: ["p1", 3] }));
    expect(loadExerciseProgress()).toEqual({ ok: ["p1"] });
  });

  it("stores each passed part once and persists it", () => {
    markPartPassed("ex", "p1");
    const p = markPartPassed("ex", "p1");
    expect(p).toEqual({ ex: ["p1"] });
    expect(loadExerciseProgress()).toEqual({ ex: ["p1"] });
  });

  it("an exercise is passed when every part is", () => {
    expect(isExercisePassed(EX, markPartPassed("ex", "p1"))).toBe(false);
    expect(isExercisePassed(EX, markPartPassed("ex", "p2"))).toBe(true);
  });
});
