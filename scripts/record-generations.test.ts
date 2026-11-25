// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isRecordingFile } from "../src/llm/recordings";
import { buildGenerateBody, mergeRecordings, toRecordedGeneration } from "./lib/recording.mjs";

// Shape returned by Ollama 0.40.18 /api/generate with logprobs (trimmed).
const RESPONSE = {
  model: "gemma4:12b",
  response: "card",
  done: true,
  total_duration: 1_500_000_000,
  eval_count: 2,
  prompt_eval_count: 41,
  logprobs: [
    { token: "card", logprob: -0.01, bytes: [99, 97, 114, 100], top_logprobs: [{ token: "card", logprob: -0.01, bytes: [99] }, { token: "fraud", logprob: -4.6, bytes: [102] }] },
  ],
};

describe("record-generations", () => {
  it("toRecordedGeneration maps output, logprobs and timing", () => {
    const r = toRecordedGeneration({ key: "classify:t1", prompt: "Classify: x", system: "You are…" }, RESPONSE);
    expect(r).toEqual({
      key: "classify:t1",
      system: "You are…",
      prompt: "Classify: x",
      output: "card",
      tokens: [{ token: "card", logprob: -0.01, top: [{ token: "card", logprob: -0.01 }, { token: "fraud", logprob: -4.6 }] }],
      durationMs: 1500,
      evalCount: 2,
      promptEvalCount: 41,
    });
  });

  it("builds the request with think off, num_ctx 32768 and logprobs when asked", () => {
    const body = buildGenerateBody("gemma4:12b", { key: "k", prompt: "p", temperature: 0.8, logprobs: true, format: { type: "object" } });
    expect(body).toEqual({
      model: "gemma4:12b",
      prompt: "p",
      format: { type: "object" },
      stream: false,
      think: false,
      logprobs: true,
      top_logprobs: 5,
      options: { num_ctx: 32768, temperature: 0.8 },
    });
  });

  it("merges new items into an existing file and keeps it valid", () => {
    const existing = { model: "gemma4:12b", ollamaVersion: "0.40.18", recordedAt: "2026-11-25T00:00:00Z", options: { temperature: 0 }, items: [{ key: "a", prompt: "p", output: "o", durationMs: 1, evalCount: 1 }] };
    const merged = mergeRecordings(existing, [{ key: "b", prompt: "p2", output: "o2", durationMs: 2, evalCount: 1 }], { model: "gemma4:12b", ollamaVersion: "0.40.18", options: { temperature: 0 }, now: "2026-11-26T00:00:00Z" });
    expect(merged.items.map((i: { key: string }) => i.key)).toEqual(["a", "b"]);
    expect(merged.recordedAt).toBe("2026-11-26T00:00:00Z");
    expect(isRecordingFile(merged)).toBe(true);
  });
});
