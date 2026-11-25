import { describe, expect, it } from "vitest";
import { findRecording, isRecordingFile, recordingLabel, type RecordingFile } from "./recordings";

const file: RecordingFile = {
  model: "gemma4:12b",
  ollamaVersion: "0.40.18",
  recordedAt: "2026-11-25T20:00:00Z",
  options: { temperature: 0 },
  items: [{ key: "classify:t1", prompt: "Classify", output: "card", durationMs: 120, evalCount: 2 }],
};

describe("recordings", () => {
  it("finds a recording by key", () => {
    expect(findRecording(file, "classify:t1")?.output).toBe("card");
    expect(findRecording(file, "nope")).toBeUndefined();
  });

  it("labels a recording with model, temperature and date", () => {
    expect(recordingLabel(file)).toBe("recorded from gemma4:12b · temperature 0 · 2026-11-25");
    expect(recordingLabel({ ...file, options: {} })).toBe("recorded from gemma4:12b · 2026-11-25");
  });

  it("checks the file shape", () => {
    expect(isRecordingFile(file)).toBe(true);
    expect(isRecordingFile({ ...file, items: undefined })).toBe(false);
    expect(isRecordingFile({ ...file, items: [{ key: "x" }] })).toBe(false);
    expect(isRecordingFile(null)).toBe(false);
  });

  it("every committed recording fixture is valid", () => {
    const files = import.meta.glob("../subjects/*/data/recordings/*.json", { eager: true, import: "default" });
    for (const [path, data] of Object.entries(files)) expect(isRecordingFile(data), path).toBe(true);
  });
});
