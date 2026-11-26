/** Module 06 data: tickets, their real MiniLM vectors, the recorded gemma4 answers, and helpers on top. */
import { findRecording, type RecordedGeneration, type RecordingFile } from "../../llm/recordings";
import { argmax, predictProba, trainSoftmax, type SoftmaxModel } from "./classifier";
import data from "./data/tickets.json";
import classifyRec from "./data/recordings/classify.json";
import emb from "./data/ticket-embeddings.json";

export interface Ticket {
  id: string;
  text: string;
  label: string;
  split: "train" | "test";
}

export const LABELS = data.labels as { id: string; description: string }[];
export const LABEL_IDS = LABELS.map((l) => l.id);
export const TICKETS = data.tickets as Ticket[];
export const TEST_TICKETS = TICKETS.filter((t) => t.split === "test");
export const TRAIN_TICKETS = TICKETS.filter((t) => t.split === "train");
export const PROMPT_TEMPLATE = data.promptTemplate;
export const CLASSIFY_RECORDINGS = classifyRec as RecordingFile;
export const GEN_MODEL = CLASSIFY_RECORDINGS.model;

const VECTORS = new Map(TICKETS.map((t, i) => [t.id, emb.vectors[i]!]));
export const ticketVector = (id: string): number[] => VECTORS.get(id)!;

export const promptFor = (text: string) => PROMPT_TEMPLATE.replace("{ticket}", text);

export const DEFAULT_TRAINING = { epochs: 200, lr: 2 };

export function trainHead(opts: { epochs: number; lr: number } = DEFAULT_TRAINING): SoftmaxModel {
  return trainSoftmax(
    TRAIN_TICKETS.map((t) => ticketVector(t.id)),
    TRAIN_TICKETS.map((t) => LABEL_IDS.indexOf(t.label)),
    LABEL_IDS.length,
    opts,
  );
}

let cachedHead: SoftmaxModel | null = null;
/** The head trained with the default settings (used by the comparator). */
export function defaultHead(): SoftmaxModel {
  cachedHead ??= trainHead();
  return cachedHead;
}

export function headVerdict(model: SoftmaxModel, vec: ArrayLike<number>): { label: string; p: number; probs: number[] } {
  const probs = predictProba(model, vec);
  const k = argmax(probs);
  return { label: LABEL_IDS[k]!, p: probs[k]!, probs };
}

export const recordingFor = (ticketId: string): RecordedGeneration | undefined => findRecording(CLASSIFY_RECORDINGS, `classify:${ticketId}`);

/**
 * gemma4's verdict from a recording: the answer word, and the probability the model gave its first token
 * (from the recorded log-probabilities), plus the runner-up tokens at that position.
 */
export function generativeVerdict(r: RecordedGeneration): {
  label: string | null;
  p: number | null;
  alternatives: { token: string; p: number }[];
} {
  const word = r.output.trim().toLowerCase().replace(/[^a-z]/g, "");
  const label = LABEL_IDS.includes(word) ? word : null;
  const first = r.tokens?.[0];
  return {
    label,
    p: first ? Math.exp(first.logprob) : null,
    alternatives: (first?.top ?? []).map((t) => ({ token: t.token, p: Math.exp(t.logprob) })),
  };
}
