/** Real model outputs recorded from Ollama (scripts/record-generations.mjs) and shipped as JSON fixtures. */

export interface TokenProb {
  token: string;
  logprob: number;
  /** The most likely alternatives at this position (including the chosen token). */
  top: { token: string; logprob: number }[];
}

export interface RecordedGeneration {
  key: string;
  system?: string;
  prompt: string;
  output: string;
  tokens?: TokenProb[];
  toolCalls?: { name: string; arguments: Record<string, unknown> }[];
  durationMs: number;
  evalCount: number;
}

export interface RecordingFile {
  model: string;
  ollamaVersion: string;
  recordedAt: string;
  options: Record<string, unknown>;
  items: RecordedGeneration[];
}

export function findRecording(file: RecordingFile, key: string): RecordedGeneration | undefined {
  return file.items.find((i) => i.key === key);
}

export function recordingLabel(file: RecordingFile): string {
  const t = file.options.temperature;
  const parts = [`recorded from ${file.model}`];
  if (typeof t === "number") parts.push(`temperature ${t}`);
  parts.push(file.recordedAt.slice(0, 10));
  return parts.join(" · ");
}

function isItem(x: unknown): boolean {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.key === "string" &&
    typeof o.prompt === "string" &&
    typeof o.output === "string" &&
    typeof o.durationMs === "number" &&
    typeof o.evalCount === "number"
  );
}

export function isRecordingFile(x: unknown): x is RecordingFile {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.model === "string" &&
    typeof o.ollamaVersion === "string" &&
    typeof o.recordedAt === "string" &&
    typeof o.options === "object" &&
    o.options !== null &&
    Array.isArray(o.items) &&
    o.items.every(isItem)
  );
}
