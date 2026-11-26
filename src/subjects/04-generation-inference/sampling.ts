import { softmax } from "../03-transformer-internals/attention";

export interface Candidate {
  token: string;
  logit: number;
}

export interface Sampled extends Candidate {
  prob: number;
  kept: boolean;
  finalProb: number;
}

export function greedy(cands: Candidate[]): string {
  return cands.reduce((best, c) => (c.logit > best.logit ? c : best)).token;
}

/**
 * Temperature-scaled softmax, then top-k (keep the k most likely; 0 = off), then top-p / nucleus (keep the
 * smallest set reaching cumulative probability p), then renormalise. Sorted most likely first.
 */
export function applySampling(cands: Candidate[], o: { temperature: number; topK: number; topP: number }): Sampled[] {
  const probs = softmax(cands.map((c) => c.logit), o.temperature);
  const order = probs.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
  const kept = new Set<number>();
  let cum = 0;
  for (const [rank, { p, i }] of order.entries()) {
    if (o.topK > 0 && rank >= o.topK) break;
    kept.add(i);
    cum += p;
    if (cum >= o.topP - 1e-9) break;
  }
  const mass = [...kept].reduce((s, i) => s + probs[i]!, 0);
  return order.map(({ p, i }) => ({ ...cands[i]!, prob: p, kept: kept.has(i), finalProb: kept.has(i) ? p / mass : 0 }));
}
