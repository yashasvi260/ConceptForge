import { findRecording, type RecordingFile } from "../../llm/recordings";
import { TICKETS, recordingKey, type Combo } from "./prompts";
import { extractJson, scoreExtraction, variance } from "./scoring";

export const SAMPLES = [0, 1, 2, 3];

export interface ComboStats {
  /** Fields right on the temperature-0 answers (8 tickets × 4 fields). */
  fieldsCorrect: number;
  fieldsTotal: number;
  /** Valid JSON with the right types, over all samples. */
  valid: number;
  outputs: number;
  /** Average number of different answers per ticket across the 4 samples (1 = always the same). */
  meanDistinct: number;
  avgMs: number;
  /** gemma4's own count of prompt tokens (first ticket). */
  promptTokens: number | null;
}

export function comboStats(file: RecordingFile, combo: Combo): ComboStats | null {
  let fieldsCorrect = 0;
  let valid = 0;
  let outputs = 0;
  let distinct = 0;
  let ms = 0;
  let promptTokens: number | null = null;
  for (const t of TICKETS) {
    const recs = SAMPLES.map((s) => findRecording(file, recordingKey(combo, t.id, s)));
    if (recs.some((r) => !r)) return null;
    const texts = recs.map((r) => r!.output);
    fieldsCorrect += scoreExtraction(extractJson(texts[0]!), t.gold).fieldsCorrect;
    for (const x of texts) {
      outputs++;
      if (scoreExtraction(extractJson(x), t.gold).valid) valid++;
    }
    distinct += variance(texts).distinct;
    ms += recs.reduce((a, r) => a + r!.durationMs, 0);
    promptTokens ??= recs[0]!.promptEvalCount ?? null;
  }
  return { fieldsCorrect, fieldsTotal: TICKETS.length * 4, valid, outputs, meanDistinct: distinct / TICKETS.length, avgMs: ms / outputs, promptTokens };
}
