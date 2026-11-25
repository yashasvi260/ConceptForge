import { describe, expect, it } from "vitest";
import template from "../subjects/_template";
import { SUBJECTS, getSubject, groupByCategory, validateSubject } from "./registry";
import { TRACK } from "./track";

describe("registry", () => {
  it("orders subjects by module number", () => {
    const numbers = SUBJECTS.map((s) => s.moduleNumber);
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
  });

  it("registers at least one subject, with unique ids", () => {
    expect(SUBJECTS.length).toBeGreaterThanOrEqual(1);
    expect(new Set(SUBJECTS.map((s) => s.id)).size).toBe(SUBJECTS.length);
  });

  it.each(SUBJECTS.map((s) => [s.id, s] as const))("%s is a valid subject", (_id, subject) => {
    expect(validateSubject(subject)).toEqual([]);
  });

  it.each(SUBJECTS.map((s) => [s.id, s] as const))("%s is a curriculum module with bridges", (_id, subject) => {
    const entry = TRACK.find((m) => m.id === subject.id);
    expect(entry, "id must be in TRACK").toBeDefined();
    expect(subject.moduleNumber).toBe(entry!.moduleNumber);
    expect(subject.part).toBe(entry!.part);
    expect(subject.bridge.buildsOn.trim()).not.toBe("");
    expect(subject.bridge.leadsTo.trim()).not.toBe("");
  });

  it("keeps the template valid so scaffolded subjects start out correct", () => {
    expect(validateSubject(template)).toEqual([]);
    expect(getSubject(template.id)).toBeUndefined();
  });

  it("reports broken subjects", () => {
    const broken = {
      ...template,
      id: "Bad Id",
      category: " ",
      estimatedMinutes: 0,
      challenges: [{ id: "q", prompt: "?", options: ["a", "b"], correctIndex: 5, explanation: "", relatedStepId: "nope" }],
    };
    expect(validateSubject(broken)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("kebab-case"),
        expect.stringContaining("correctIndex"),
        expect.stringContaining("unknown step"),
        expect.stringContaining("category"),
        expect.stringContaining("estimatedMinutes"),
      ]),
    );
  });

  it("groups subjects by category, keeping registration order", () => {
    const a = { ...template, id: "a", category: "Stage 1" };
    const b = { ...template, id: "b", category: "Stage 2" };
    const c = { ...template, id: "c", category: "Stage 1" };
    expect(groupByCategory([a, b, c]).map((g) => [g.category, g.subjects.map((s) => s.id)])).toEqual([
      ["Stage 1", ["a", "c"]],
      ["Stage 2", ["b"]],
    ]);
  });
});
