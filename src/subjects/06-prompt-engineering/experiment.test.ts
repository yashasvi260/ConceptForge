import { describe, expect, it } from "vitest";
import type { RecordingFile } from "../../llm/recordings";
import { comboStats } from "./experiment";
import { TICKETS, recordingKey } from "./prompts";

const combo = { role: false, fewShot: false, cot: false, schema: false };
const ok = (t: (typeof TICKETS)[number]) => JSON.stringify(t.gold);

function file(outputFor: (ticketIndex: number, sample: number) => string): RecordingFile {
  return {
    model: "gemma4:12b",
    ollamaVersion: "x",
    recordedAt: "2026-11-25T00:00:00Z",
    options: {},
    items: TICKETS.flatMap((t, i) => [0, 1, 2, 3].map((s) => ({ key: recordingKey(combo, t.id, s), prompt: "p", output: outputFor(i, s), durationMs: 100 * (s + 1), evalCount: 10, promptEvalCount: 50 }))),
  };
}

describe("experiment statistics", () => {
  it("perfect, consistent answers", () => {
    const s = comboStats(file((i) => ok(TICKETS[i]!)), combo)!;
    expect(s).toMatchObject({ fieldsCorrect: 32, fieldsTotal: 32, valid: 32, outputs: 32, meanDistinct: 1, promptTokens: 50 });
    expect(s.avgMs).toBe(250);
  });

  it("invalid outputs count as invalid and inconsistent samples raise the distinct count", () => {
    const s = comboStats(file((i, smp) => (smp === 3 ? "sorry" : ok(TICKETS[i]!))), combo)!;
    expect(s.valid).toBe(24);
    expect(s.fieldsCorrect).toBe(32); // accuracy uses sample 0 (temperature 0)
    expect(s.meanDistinct).toBe(2);
  });

  it("returns null when a combo has no recordings", () => {
    expect(comboStats({ ...file(() => ""), items: [] }, combo)).toBeNull();
  });
});
