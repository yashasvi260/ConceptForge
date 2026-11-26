/**
 * A tiny Unigram language-model tokenizer (Kudo 2018), SentencePiece style: spaces become ▁,
 * every piece has a probability, and a segmentation's score is the sum of its pieces'
 * log-probabilities. Viterbi finds the best one. The vocabulary is illustrative (made up for
 * teaching); real SentencePiece models learn tens of thousands of pieces from data.
 */

export const SPACE = "▁"; // ▁
/** Log-probability for a character that isn't in the vocabulary (keeps tokenization lossless). */
export const UNKNOWN_CHAR_LOGPROB = -16;

const COUNTS: Record<string, number> = {
  "▁the": 900, "▁to": 700, "▁a": 650, "▁is": 500, "▁of": 600, "▁and": 640, "▁in": 520, "▁it": 300,
  "▁hello": 120, "▁hell": 40, "▁he": 260, "▁help": 90, "llo": 25, "lo": 80, "ll": 60, "▁world": 110,
  "▁wor": 30, "ld": 70, "▁word": 140, "orld": 8, "▁w": 120, "or": 150, "▁un": 220, "believ": 18,
  "able": 160, "▁unbeliev": 6, "▁believe": 40, "▁token": 70, "ization": 60, "iz": 40, "ation": 210,
  "ize": 50, "er": 300, "s": 520, "ed": 260, "ing": 300, "▁tokenizer": 12, "▁split": 45, "▁words": 80,
  "▁fun": 60, "▁new": 140, "est": 90, "▁low": 70, "▁wid": 20, "▁straw": 15, "berry": 20, "▁strawberry": 10,
  "▁play": 110, "▁cat": 70, "▁sat": 40, "▁on": 400, "▁mat": 25, "▁日本": 20, "語": 15, "日本語": 5,
  "▁": 400, "e": 300, "a": 280, "o": 260, "i": 250, "n": 240, "t": 260, "r": 230, "l": 200, "h": 180,
  "d": 170, "w": 90, "u": 120, "b": 70, "k": 60, "z": 30, "p": 80, "y": 90, "c": 110, "f": 80, "g": 90,
  "m": 90, "v": 50, "x": 20, "j": 10, "q": 8, ",": 120, ".": 150, "!": 30, "?": 30, "'": 40,
};

const TOTAL = Object.values(COUNTS).reduce((a, b) => a + b, 0);

export const UNIGRAM_VOCAB: Record<string, number> = Object.fromEntries(
  Object.entries(COUNTS).map(([piece, n]) => [piece, Math.log(n / TOTAL)]),
);

const MAX_PIECE = Math.max(...Object.keys(UNIGRAM_VOCAB).map((p) => Array.from(p).length));

export interface Segmentation {
  pieces: string[];
  logProb: number;
}

/** SentencePiece-style normalisation: collapse whitespace, prefix and replace spaces with ▁. */
export function normalize(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  return t ? SPACE + t.replace(/ /g, SPACE) : "";
}

function pieceScore(piece: string, length: number): number | null {
  const lp = UNIGRAM_VOCAB[piece];
  if (lp !== undefined) return lp;
  return length === 1 ? UNKNOWN_CHAR_LOGPROB : null;
}

/** Viterbi: the single most probable segmentation. */
export function bestSegmentation(text: string): Segmentation {
  const chars = Array.from(normalize(text));
  const n = chars.length;
  if (n === 0) return { pieces: [], logProb: 0 };
  const best = new Array<number>(n + 1).fill(Number.NEGATIVE_INFINITY);
  const back = new Array<number>(n + 1).fill(0);
  best[0] = 0;
  for (let end = 1; end <= n; end++) {
    for (let len = 1; len <= Math.min(MAX_PIECE, end); len++) {
      const start = end - len;
      if (best[start] === Number.NEGATIVE_INFINITY) continue;
      const score = pieceScore(chars.slice(start, end).join(""), len);
      if (score === null) continue;
      const total = best[start]! + score;
      if (total > best[end]!) {
        best[end] = total;
        back[end] = start;
      }
    }
  }
  const pieces: string[] = [];
  for (let end = n; end > 0; end = back[end]!) pieces.unshift(chars.slice(back[end]!, end).join(""));
  return { pieces, logProb: best[n]! };
}

/** The k most probable segmentations, best first (k-best Viterbi; meant for short text). */
export function topSegmentations(text: string, k: number): Segmentation[] {
  const chars = Array.from(normalize(text)).slice(0, 81); // leading ▁ + up to 80 characters
  const n = chars.length;
  if (n === 0 || k <= 0) return [];
  const beams: Segmentation[][] = Array.from({ length: n + 1 }, () => []);
  beams[0] = [{ pieces: [], logProb: 0 }];
  for (let end = 1; end <= n; end++) {
    const candidates: Segmentation[] = [];
    for (let len = 1; len <= Math.min(MAX_PIECE, end); len++) {
      const start = end - len;
      const piece = chars.slice(start, end).join("");
      const score = pieceScore(piece, len);
      if (score === null) continue;
      for (const prev of beams[start]!) candidates.push({ pieces: [...prev.pieces, piece], logProb: prev.logProb + score });
    }
    beams[end] = candidates.sort((a, b) => b.logProb - a.logProb).slice(0, k);
  }
  return beams[n]!;
}

/** Probability of a segmentation relative to the given alternatives (for display). */
export function relativeProbabilities(segs: Segmentation[]): number[] {
  if (segs.length === 0) return [];
  const m = Math.max(...segs.map((s) => s.logProb));
  const exps = segs.map((s) => Math.exp(s.logProb - m));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}
