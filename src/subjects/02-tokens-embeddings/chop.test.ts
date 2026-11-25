import { describe, expect, it } from "vitest";
import { splitChars, splitWords } from "./chop";

describe("chop", () => {
  it("splits characters by code point", () => {
    expect(splitChars("hi 🤖")).toEqual(["h", "i", " ", "🤖"]);
  });

  it("splits words and keeps punctuation separate", () => {
    expect(splitWords("Unbelievably, it works!")).toEqual(["Unbelievably", ",", "it", "works", "!"]);
    expect(splitWords("   ")).toEqual([]);
  });
});
