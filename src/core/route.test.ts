import { describe, expect, it } from "vitest";
import { clampStep, formatHash, parseHash } from "./route";

describe("route", () => {
  it("parses lesson and challenge hashes", () => {
    expect(parseHash("#/transformers/3")).toEqual({ subjectId: "transformers", stepIndex: 2, mode: "lesson" });
    expect(parseHash("#/transformers/challenge")).toEqual({ subjectId: "transformers", stepIndex: null, mode: "challenge" });
    expect(parseHash("")).toEqual({ subjectId: null, stepIndex: null, mode: "lesson" });
    expect(parseHash("#/x/abc").stepIndex).toBeNull();
  });

  it("formats hashes that parse back to the same place", () => {
    expect(parseHash(formatHash("data-lakehouse", "lesson", 4))).toEqual({
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
