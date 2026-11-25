import { describe, expect, it } from "vitest";
import { courseSummary, moduleStatus, partSummary, quizBadge, resumeTarget } from "./courseProgress";
import { emptyProgress, type ProgressMap } from "./storage";
import type { LessonStep, SubjectModule } from "./types";

const step = (id: string): LessonStep => ({ id, title: id, summary: "", body: ["x"], view: id });

function fake(id: string, moduleNumber: number, part: 1 | 2 | 3 | 4 = 1): SubjectModule {
  return {
    id,
    moduleNumber,
    part,
    steps: [step("a"), step("b")],
    challenges: Array.from({ length: 9 }, (_, i) => ({ id: `q${i}`, prompt: "?", options: ["x", "y"], correctIndex: 0, explanation: "" })),
  } as unknown as SubjectModule;
}

const m1 = fake("01-intro-llms", 1);
const m2 = fake("02-tokens-embeddings", 2);
const m3 = fake("03-transformer-internals", 3);
const built = [m1, m2, m3];

const done = (visited: string[], attempts = 1) => ({ ...emptyProgress(), visitedSteps: visited, attempts });
const complete = (...ids: string[]): ProgressMap => Object.fromEntries(ids.map((id) => [id, done(["a", "b"])]));

describe("moduleStatus", () => {
  it("coming soon for an unbuilt module", () => {
    expect(moduleStatus(undefined, {})).toEqual({ kind: "coming-soon" });
  });

  it("not started", () => {
    expect(moduleStatus(m1, {})).toEqual({ kind: "not-started", total: 2 });
  });

  it("in progress counts seen steps", () => {
    expect(moduleStatus(m1, { [m1.id]: done(["a"], 0) })).toEqual({ kind: "in-progress", seen: 1, total: 2 });
    expect(moduleStatus(m1, { [m1.id]: done([], 1) })).toEqual({ kind: "in-progress", seen: 0, total: 2 });
  });

  it("complete needs every step and a quiz attempt", () => {
    expect(moduleStatus(m1, { [m1.id]: done(["a", "b"], 0) }).kind).toBe("in-progress");
    expect(moduleStatus(m1, { [m1.id]: done(["a", "b"], 1) })).toEqual({ kind: "complete", total: 2 });
  });

  it("ignores stale step ids", () => {
    expect(moduleStatus(m1, { [m1.id]: done(["a", "old-1", "old-2"], 1) })).toEqual({ kind: "in-progress", seen: 1, total: 2 });
  });
});

describe("summaries", () => {
  it("course summary counts all 14", () => {
    expect(courseSummary(built, complete(m1.id))).toEqual({ completed: 1, total: 14, percent: 7 });
    expect(courseSummary(built, {})).toEqual({ completed: 0, total: 14, percent: 0 });
  });

  it("part summary", () => {
    expect(partSummary(1, built, complete(m1.id))).toEqual({ completed: 1, total: 3 });
    expect(partSummary(2, built, complete(m1.id))).toEqual({ completed: 0, total: 6 });
  });
});

describe("resumeTarget", () => {
  it("starts at Module 01", () => {
    expect(resumeTarget(built, {})).toMatchObject({ entry: { id: m1.id }, built: true });
  });

  it("moves to the next unfinished built module", () => {
    expect(resumeTarget(built, complete(m1.id))).toMatchObject({ entry: { id: m2.id }, built: true });
  });

  it("points at the first unbuilt module when every built one is complete", () => {
    expect(resumeTarget(built, complete(m1.id, m2.id, m3.id))).toMatchObject({ entry: { id: "04-text-classification" }, built: false });
  });
});

describe("quizBadge", () => {
  it("shows best correct answers out of the module's questions", () => {
    expect(quizBadge(m1, {})).toBe("0/9");
    expect(quizBadge(m1, { [m1.id]: { ...done([]), bestScore: { correct: 5, total: 9 } } })).toBe("5/9");
  });
});
