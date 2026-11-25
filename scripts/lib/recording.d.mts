import type { RecordedGeneration, RecordingFile } from "../../src/llm/recordings";

export interface RecordingJob {
  key: string;
  prompt?: string;
  system?: string;
  format?: unknown;
  temperature?: number;
  logprobs?: boolean;
  messages?: unknown[];
  tools?: unknown[];
}
export const NUM_CTX: number;
export function buildGenerateBody(model: string, job: RecordingJob): Record<string, unknown>;
export function toRecordedGeneration(job: RecordingJob, response: Record<string, unknown>): RecordedGeneration;
export function mergeRecordings(
  existing: RecordingFile | null,
  newItems: RecordedGeneration[],
  meta: { model: string; ollamaVersion: string; options: Record<string, unknown>; now: string },
): RecordingFile;
