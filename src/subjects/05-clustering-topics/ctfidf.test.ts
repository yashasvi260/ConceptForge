import { describe, expect, it } from "vitest";
import { cTfIdf, tokenizeWords } from "./ctfidf";

describe("c-TF-IDF", () => {
  it("c-TF-IDF ranks a cluster's distinctive word first", () => {
    const r = cTfIdf(
      [
        ["the app crashes", "app login fails", "the app is slow"],
        ["the fee is high", "fee refund please", "the overdraft fee"],
      ],
      2,
    );
    expect(r[0]!.words[0]!.word).toBe("app");
    expect(r[1]!.words[0]!.word).toBe("fee");
    expect(r[0]!.words.map((w) => w.word)).not.toContain("the"); // stop-word
  });

  it("follows BERTopic's formula tf · log(1 + A / f)", () => {
    // cluster 0 words: app×2, crash×1 (3 words); cluster 1: fee×1 (1 word). A = (3+1)/2 = 2.
    const r = cTfIdf([["app app crash"], ["fee"]], 3);
    const app = r[0]!.words.find((w) => w.word === "app")!;
    expect(app.score).toBeCloseTo((2 / 3) * Math.log(1 + 2 / 2), 10);
    const fee = r[1]!.words.find((w) => w.word === "fee")!;
    expect(fee.score).toBeCloseTo((1 / 1) * Math.log(1 + 2 / 1), 10);
  });

  it("tokenizes to lowercase words without stop-words", () => {
    expect(tokenizeWords("The App's login, FAILS!")).toEqual(["app", "login", "fails"]);
  });
});
