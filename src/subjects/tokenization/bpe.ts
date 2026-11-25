/**
 * Byte-Pair Encoding as in Sennrich, Haddow & Birch (2016), Algorithm 1: words become characters
 * plus an end-of-word symbol, then the most frequent adjacent pair is merged, repeatedly.
 * Pairs never cross word boundaries. Ties go to the pair seen first (as Python's `max` does).
 */

export const END_OF_WORD = "</w>";
const MAX_WORDS = 300;
const MAX_WORD_CHARS = 40;

export interface Merge {
  pair: [string, string];
  merged: string;
  count: number;
}

export interface BpeSnapshot {
  /** Number of merges applied so far. */
  step: number;
  words: { symbols: string[]; freq: number }[];
  /** Every adjacent pair with its frequency, most frequent first. */
  pairCounts: { pair: [string, string]; count: number }[];
}

export interface BpeResult {
  merges: Merge[];
  vocab: string[];
  snapshots: BpeSnapshot[];
}

function wordFrequencies(corpus: string): Map<string, number> {
  const freqs = new Map<string, number>();
  for (const word of corpus.split(/\s+/)) {
    if (!word) continue;
    const w = Array.from(word).slice(0, MAX_WORD_CHARS).join("");
    if (!freqs.has(w) && freqs.size >= MAX_WORDS) continue;
    freqs.set(w, (freqs.get(w) ?? 0) + 1);
  }
  return freqs;
}

function countPairs(words: { symbols: string[]; freq: number }[]): Map<string, { pair: [string, string]; count: number }> {
  const pairs = new Map<string, { pair: [string, string]; count: number }>();
  for (const { symbols, freq } of words) {
    for (let i = 0; i < symbols.length - 1; i++) {
      const a = symbols[i]!;
      const b = symbols[i + 1]!;
      const key = `${a}\u0000${b}`;
      const entry = pairs.get(key);
      if (entry) entry.count += freq;
      else pairs.set(key, { pair: [a, b], count: freq });
    }
  }
  return pairs;
}

function applyMerge(symbols: string[], [a, b]: [string, string]): string[] {
  const out: string[] = [];
  for (let i = 0; i < symbols.length; i++) {
    if (symbols[i] === a && symbols[i + 1] === b) {
      out.push(a + b);
      i++;
    } else out.push(symbols[i]!);
  }
  return out;
}

function snapshot(step: number, words: { symbols: string[]; freq: number }[]): BpeSnapshot {
  const pairCounts = [...countPairs(words).values()].sort((x, y) => y.count - x.count);
  return { step, words: words.map((w) => ({ symbols: [...w.symbols], freq: w.freq })), pairCounts };
}

export function trainBpe(corpus: string, numMerges: number): BpeResult {
  let words = [...wordFrequencies(corpus)].map(([w, freq]) => ({ symbols: [...Array.from(w), END_OF_WORD], freq }));
  const vocab: string[] = [];
  for (const w of words) for (const s of w.symbols) if (!vocab.includes(s)) vocab.push(s);

  const merges: Merge[] = [];
  const snapshots: BpeSnapshot[] = [snapshot(0, words)];
  for (let step = 0; step < numMerges; step++) {
    let best: { pair: [string, string]; count: number } | null = null;
    for (const entry of countPairs(words).values()) if (!best || entry.count > best.count) best = entry;
    if (!best) break;
    const merge: Merge = { pair: best.pair, merged: best.pair[0] + best.pair[1], count: best.count };
    words = words.map((w) => ({ symbols: applyMerge(w.symbols, merge.pair), freq: w.freq }));
    merges.push(merge);
    if (!vocab.includes(merge.merged)) vocab.push(merge.merged);
    snapshots.push(snapshot(step + 1, words));
  }
  return { merges, vocab, snapshots };
}

export interface BpeTraceStep {
  merge: Merge;
  before: string[];
  after: string[];
}

/** Tokenize one word by replaying the learned merges in the order they were learned. */
export function encodeBpe(word: string, merges: Merge[]): { tokens: string[]; trace: BpeTraceStep[] } {
  if (!word) return { tokens: [], trace: [] };
  let symbols = [...Array.from(word), END_OF_WORD];
  const trace: BpeTraceStep[] = [];
  for (const merge of merges) {
    if (symbols.length < 2) break;
    const after = applyMerge(symbols, merge.pair);
    if (after.length !== symbols.length) {
      trace.push({ merge, before: symbols, after });
      symbols = after;
    }
  }
  return { tokens: symbols, trace };
}
