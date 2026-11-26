import { describe, expect, it } from "vitest";
import task from "./data/task.json";
import { ALL_COMBOS, buildPrompt, comboKey, recordingKey } from "./prompts";

const ticket = task.tickets[0]!;

describe("prompt combinations", () => {
  it("has 16 distinct combos", () => {
    expect(ALL_COMBOS).toHaveLength(16);
    expect(new Set(ALL_COMBOS.map(comboKey)).size).toBe(16);
    expect(comboKey({ role: true, fewShot: false, cot: true, schema: false })).toBe("r1f0c1s0");
    expect(recordingKey({ role: false, fewShot: false, cot: false, schema: false }, "x1", 0)).toBe("r0f0c0s0:x1:s0");
  });

  it("prompt contains each component exactly when toggled", () => {
    for (const c of ALL_COMBOS) {
      const p = buildPrompt(c, ticket.text);
      expect(p.system === task.role, comboKey(c)).toBe(c.role);
      expect(p.prompt.includes(task.fewShot[0]!.text), comboKey(c)).toBe(c.fewShot);
      expect(p.prompt.includes("step by step"), comboKey(c)).toBe(c.cot);
      expect(p.format !== undefined, comboKey(c)).toBe(c.schema);
      expect(p.prompt).toContain(ticket.text);
      expect(p.prompt).toContain("Reply in JSON");
    }
  });

  it("schema combo sets format; with CoT the schema gains a leading reasoning field", () => {
    const plain = buildPrompt({ role: false, fewShot: false, cot: false, schema: true }, ticket.text);
    expect(plain.format).toEqual(task.schema);
    const withCot = buildPrompt({ role: false, fewShot: false, cot: true, schema: true }, ticket.text).format as { properties: Record<string, unknown>; required: string[] };
    expect(Object.keys(withCot.properties)[0]).toBe("reasoning");
    expect(withCot.required[0]).toBe("reasoning");
  });
});
