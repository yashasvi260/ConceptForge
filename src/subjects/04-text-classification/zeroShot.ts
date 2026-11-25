import { cosine } from "../../ml/vector";
import { softmax } from "./classifier";

/**
 * Cosine similarities between sentence vectors are bunched together (MiniLM scores for related text sit in
 * roughly 0.1–0.6), so to show them as a probability-like split we apply softmax(score / T) with this fixed T.
 * The view always shows the raw cosine next to it.
 */
export const ZERO_SHOT_TEMPERATURE = 0.05;

export function zeroShot(ticketVec: ArrayLike<number>, labelVecs: ArrayLike<number>[]): { scores: number[]; probs: number[] } {
  const scores = labelVecs.map((l) => cosine(ticketVec, l));
  return { scores, probs: softmax(scores.map((s) => s / ZERO_SHOT_TEMPERATURE)) };
}
