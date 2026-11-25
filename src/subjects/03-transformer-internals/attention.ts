/**
 * Illustrative self-attention: four hand-designed heads, each showing one behaviour real heads are known
 * for (not weights from a trained model). The arithmetic (scores → masking → softmax) is the real thing.
 */

export interface HeadInfo {
  id: number;
  name: string;
  description: string;
}

export const HEADS: HeadInfo[] = [
  { id: 0, name: "Previous token", description: "Looks one position back, a simple positional pattern." },
  { id: 1, name: "Meaning", description: "Related content words attend to each other (bank ↔ loan / river)." },
  { id: 2, name: "First token", description: "Parks attention on the first token when nothing else is relevant." },
  { id: 3, name: "Syntax", description: "Verbs look at nouns around them; nouns look at their verb." },
];

const CLUSTERS: string[][] = [
  ["bank", "loan", "approved", "money", "cash", "deposited", "credit", "interest"],
  ["river", "water", "flooded", "shore", "fish", "boat", "picnic"],
  ["cat", "dog", "sat", "mat", "chased"],
];
const STOP = new Set(["the", "a", "an", "of", "on", "in", "to", "and", "is", "was", "at", "we", "i"]);
const VERB = /(ed|ing)$|^(sat|is|was|ran)$/;

export function tokenizeWords(text: string): string[] {
  return (text.match(/[\p{L}\p{N}']+|[^\s\p{L}\p{N}]/gu) ?? []).slice(0, 12);
}

function jitter(seed: string): number {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (((h >>> 0) / 0xffffffff) * 2 - 1) * 0.25;
}

const cluster = (w: string) => CLUSTERS.findIndex((c) => c.includes(w.toLowerCase()));

/** Pre-softmax score of token i attending to token j under a head. */
export function headScore(head: number, tokens: string[], i: number, j: number): number {
  const a = tokens[i]!.toLowerCase();
  const b = tokens[j]!.toLowerCase();
  const n = jitter(`${head}:${a}:${b}:${i}:${j}`);
  switch (head) {
    case 0:
      return (j === i - 1 ? 4 : j === i ? 1.2 : -0.6 * Math.abs(i - 1 - j)) + n;
    case 1: {
      const ca = cluster(a);
      let s = ca >= 0 && ca === cluster(b) ? (i === j ? 1.5 : 3.2) : i === j ? 1.8 : 0;
      if (STOP.has(b)) s -= 1.6;
      return s + n;
    }
    case 2:
      return (j === 0 ? 3 : j === i ? 1 : -0.5) + n;
    default: {
      if (VERB.test(a) && !STOP.has(b) && i !== j) return 2.6 - 0.15 * Math.abs(i - j) + n;
      if (!STOP.has(a) && VERB.test(b) && i !== j) return 2.2 - 0.15 * Math.abs(i - j) + n;
      return (i === j ? 0.8 : -0.4) + n;
    }
  }
}

/** Numerically stable softmax with temperature; −∞ entries get probability 0. */
export function softmax(xs: number[], temperature = 1): number[] {
  const t = Math.max(temperature, 1e-6);
  const scaled = xs.map((x) => x / t);
  const m = Math.max(...scaled);
  if (!Number.isFinite(m)) return xs.map(() => 0);
  const e = scaled.map((x) => (Number.isFinite(x) ? Math.exp(x - m) : 0));
  const sum = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / sum);
}

export function scoreRow(tokens: string[], head: number, i: number, causal: boolean): number[] {
  return tokens.map((_, j) => (causal && j > i ? Number.NEGATIVE_INFINITY : headScore(head, tokens, i, j)));
}

export function attentionMatrix(tokens: string[], head: number, causal: boolean): number[][] {
  return tokens.map((_, i) => softmax(scoreRow(tokens, head, i, causal)));
}
