import { describe, expect, it } from "vitest";
import { findWord } from "./bank";

describe("findWord", () => {
  it("finds a whole-word occurrence", () => {
    expect(findWord(["the", "river", "bank"], "bank")).toEqual([[2]]);
  });

  it("joins ## word pieces and matches case-insensitively", () => {
    expect(findWord(["the", "bank", "##ing", "bank"], "banking")).toEqual([[1, 2]]);
    expect(findWord(["the", "bank"], "BANK")).toEqual([[1]]);
  });

  it("returns every occurrence, and nothing when absent", () => {
    expect(findWord(["bank", "by", "the", "bank"], "bank")).toEqual([[0], [3]]);
    expect(findWord(["a"], "bank")).toEqual([]);
    expect(findWord([], "")).toEqual([]);
  });
});
