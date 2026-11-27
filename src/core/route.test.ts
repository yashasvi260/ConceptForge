import { describe, expect, it } from "vitest";
import { HOME_HASH, clampStep, formatHash, parseHash } from "./route";

describe("route", () => {
  it("parses lesson and challenge hashes", () => {
    expect(parseHash("#/transformers/3")).toEqual({ view: "module", subjectId: "transformers", stepIndex: 2, mode: "lesson" });
    expect(parseHash("#/transformers/challenge")).toEqual({ view: "module", subjectId: "transformers", stepIndex: null, mode: "challenge" });
    expect(parseHash("#/x/abc").stepIndex).toBeNull();
  });

  it("empty and #/ are the course page", () => {
    const course = { view: "course", subjectId: null, stepIndex: null, mode: "lesson" };
    expect(parseHash("")).toEqual(course);
    expect(parseHash("#")).toEqual(course);
    expect(parseHash(HOME_HASH)).toEqual(course);
    expect(HOME_HASH).toBe("#/");
  });

  it("quiz and challenge both open the practice check", () => {
    expect(parseHash("#/01-intro-llms/quiz")).toMatchObject({ view: "module", mode: "challenge" });
    expect(parseHash("#/01-intro-llms/challenge")).toMatchObject({ view: "module", mode: "challenge" });
  });

  it("formatHash writes quiz", () => {
    expect(formatHash("01-intro-llms", "challenge", 3)).toBe("#/01-intro-llms/quiz");
  });

  it("formats hashes that parse back to the same place", () => {
    expect(parseHash(formatHash("data-lakehouse", "lesson", 4))).toEqual({
      view: "module",
      subjectId: "data-lakehouse",
      stepIndex: 4,
      mode: "lesson",
    });
  });

  it("clamps step indexes", () => {
    expect(clampStep(-1, 5)).toBe(0);
    expect(clampStep(9, 5)).toBe(4);
    expect(clampStep(3, 0)).toBe(0);
  });
});

describe("steps moved between modules", () => {
  it("the old Module 03 KV-cache link opens that lesson in Module 04; steps 9 and 10 stay in Module 03", () => {
    expect(parseHash("#/03-transformer-internals/11")).toEqual({ view: "module", subjectId: "04-generation-inference", stepIndex: 2, mode: "lesson" });
    expect(parseHash("#/03-transformer-internals/10")).toEqual({ view: "module", subjectId: "03-transformer-internals", stepIndex: 9, mode: "lesson" });
    expect(parseHash("#/03-transformer-internals/9")).toEqual({ view: "module", subjectId: "03-transformer-internals", stepIndex: 8, mode: "lesson" });
  });
});
