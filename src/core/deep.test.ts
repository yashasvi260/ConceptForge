import { describe, expect, it } from "vitest";
import { validateDeep, wordCount } from "./deep";
import type { DeepLesson } from "./types";

const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ");

function valid(): DeepLesson {
  return {
    why: [words(250)],
    worked: [{ kind: "table", caption: "t", columns: ["a"], rows: [[1]], source: "worked/x.py" }],
    concept: [{ heading: "Part", paragraphs: [words(900)], mistake: "A common mistake." }],
    guided: "Predict, then change it, then explain.",
    build: {
      id: "ex",
      title: "Ex",
      packages: [],
      parts: [{ id: "p1", prompt: "Do it", starter: "x = None", solution: "x = 2", checks: "def check_x(ns): assert ns['x'] == 2", hints: ["h"] }],
    },
    local: [],
    checks: [
      { id: "q1", prompt: "?", options: ["a", "b"], correctIndex: 0, explanation: "e" },
      { id: "q2", prompt: "?", options: ["a", "b"], correctIndex: 1, explanation: "e" },
    ],
    oneSentence: "One sentence.",
    deeper: [{ label: "Paper", url: "https://example.org", adds: "More." }],
  };
}

describe("wordCount", () => {
  it("counts words across paragraphs", () => {
    expect(wordCount(["a b", "c"])).toBe(3);
    expect(wordCount(["  ", ""])).toBe(0);
  });
});

describe("validateDeep", () => {
  it("accepts a lesson that meets the depth standard", () => {
    expect(validateDeep(valid())).toEqual([]);
  });

  it("reports each shortfall", () => {
    const d = valid();
    d.why = [words(40)];
    d.concept = [{ heading: "P", paragraphs: [words(100)] }];
    d.checks = d.checks.slice(0, 1);
    d.oneSentence = " ";
    d.worked = [{ kind: "text", text: "only text" }];
    const p = validateDeep(d);
    expect(p).toContain("why: 40 words (want 150–450)");
    expect(p.some((x) => x.startsWith("concept: 100 words"))).toBe(true);
    expect(p).toContain("concept: no common mistake");
    expect(p).toContain("checks: 1 (want 2–3)");
    expect(p).toContain("worked: no table");
    expect(p).toContain("oneSentence: empty");
  });

  it("reports missing or non-https sources", () => {
    const d = valid();
    d.deeper = [];
    expect(validateDeep(d)).toContain("deeper: 0 (want 1–3)");
    d.deeper = [{ label: "x", url: "http://example.org", adds: "y" }];
    expect(validateDeep(d)).toContain("deeper: not https: http://example.org");
  });

  it("reports exercises without parts or checks", () => {
    const d = valid();
    d.build = { ...d.build, parts: [] };
    expect(validateDeep(d)).toContain("build: no parts");
    d.build = { ...d.build, parts: [{ id: "p1", prompt: "x", starter: "", solution: "", checks: "  ", hints: [] }] };
    expect(validateDeep(d)).toContain("part p1: no checks");
  });

  it("reports worked tables with repeated column names (they are React keys)", () => {
    const d = valid();
    d.worked = [{ kind: "table", caption: "t", columns: ["head", "weight", "weight"], rows: [[0, 1, 2]], source: "worked/x.py" }];
    expect(validateDeep(d)).toContain('worked "t": repeated column "weight"');
  });
});
