import { describe, expect, it } from "vitest";
import { extractJson, scoreExtraction, variance } from "./scoring";

const gold = { category: "fraud", amount: 300, currency: "GBP", urgent: true };

describe("scoring", () => {
  it("extractJson takes the last JSON block", () => {
    expect(extractJson('Thinking... {"a": 1} then final:\n{"category":"card","amount":null,"currency":null,"urgent":false}')).toEqual({
      category: "card",
      amount: null,
      currency: null,
      urgent: false,
    });
    expect(extractJson('```json\n{"x": {"y": 2}}\n```')).toEqual({ x: { y: 2 } });
  });

  it("a brace inside a JSON string doesn't break extraction", () => {
    const out = '{"reasoning": "so the final answer is {", "category": "transfer", "amount": 300, "currency": "GBP", "urgent": true}';
    expect(extractJson(out)).toMatchObject({ category: "transfer", amount: 300 });
    expect(extractJson("```json\n" + out + "\n```")).toMatchObject({ category: "transfer" });
  });

  it("invalid JSON scores as invalid", () => {
    expect(extractJson("category: fraud, amount 300")).toBeNull();
    expect(extractJson("{category: fraud}")).toBeNull();
    expect(scoreExtraction(null, gold)).toEqual({ valid: false, fieldsCorrect: 0, total: 4 });
    expect(scoreExtraction({ category: "fraud" }, gold).valid).toBe(false);
  });

  it("scoring counts fields", () => {
    expect(scoreExtraction({ category: "fraud", amount: 300, currency: "gbp", urgent: true }, gold)).toEqual({ valid: true, fieldsCorrect: 4, total: 4 });
    expect(scoreExtraction({ category: "card", amount: 300.0, currency: "GBP", urgent: false }, gold)).toEqual({ valid: true, fieldsCorrect: 2, total: 4 });
    expect(scoreExtraction({ category: "fraud", amount: "300", currency: "GBP", urgent: true }, gold).valid).toBe(false);
    expect(scoreExtraction({ category: "account", amount: null, currency: null, urgent: false }, { category: "account", amount: null, currency: null, urgent: false }).fieldsCorrect).toBe(4);
  });

  it("variance counts distinct answers", () => {
    expect(variance(['{"category":"card","amount":1,"currency":"USD","urgent":false}', '{ "urgent": false, "currency": "USD", "amount": 1, "category": "card" }'])).toEqual({
      distinct: 1,
      of: 2,
    });
    expect(variance(['{"category":"card","amount":1,"currency":"USD","urgent":false}', "oops", "nope"]).distinct).toBe(3);
  });
});
