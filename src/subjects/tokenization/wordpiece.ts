/**
 * WordPiece encoding as used by BERT: a basic pre-tokenizer (lower-case, strip accents, split on
 * whitespace and punctuation), then greedy longest-match-first over the vocabulary, marking
 * word-internal pieces with `##`. If any part of a word can't be matched, the whole word is [UNK].
 */

export const UNK = "[UNK]";
const MAX_WORD_CHARS = 100;

export interface WordPieceVocab {
  tokens: string[];
  index: Map<string, number>;
}

export function parseVocab(text: string): WordPieceVocab {
  const tokens = text.split(/\r?\n/);
  if (tokens.at(-1) === "") tokens.pop();
  return { tokens, index: new Map(tokens.map((t, i) => [t, i])) };
}

/** Cache a vocabulary load, but forget failures so a retry really tries again. */
export function createVocabLoader(importer: () => Promise<{ default: string }>): () => Promise<WordPieceVocab> {
  let cached: Promise<WordPieceVocab> | null = null;
  return () => {
    if (!cached) {
      const p = importer().then((m) => parseVocab(m.default));
      p.catch(() => {
        if (cached === p) cached = null;
      });
      cached = p;
    }
    return cached;
  };
}

/** Lazily load the real bert-base-uncased vocabulary (kept out of the main bundle). */
export const loadBertVocab = createVocabLoader(() => import("./data/bert-base-uncased-vocab.txt?raw"));

/** BERT's `_is_punctuation`: all non-alphanumeric ASCII, plus Unicode punctuation (P*). */
const isPunct = (ch: string) => {
  const cp = ch.codePointAt(0)!;
  if ((cp >= 33 && cp <= 47) || (cp >= 58 && cp <= 64) || (cp >= 91 && cp <= 96) || (cp >= 123 && cp <= 126)) return true;
  return /\p{P}/u.test(ch);
};
const isCjk = (ch: string) => /[一-鿿㐀-䶿豈-﫿]/u.test(ch);

/** BERT's BasicTokenizer (uncased): lower-case, strip accents, split punctuation and CJK characters. */
export function basicTokenize(text: string): string[] {
  const cleaned = text.toLowerCase().normalize("NFD").replace(/\p{Mn}/gu, "");
  const out: string[] = [];
  for (const chunk of cleaned.split(/\s+/)) {
    let current = "";
    for (const ch of chunk) {
      if (isPunct(ch) || isCjk(ch)) {
        if (current) out.push(current);
        out.push(ch);
        current = "";
      } else current += ch;
    }
    if (current) out.push(current);
  }
  return out;
}

export interface WordPieceStep {
  word: string;
  /** Candidates checked against the vocabulary, in order. */
  tried: string[];
  /** Pieces found, or null when the word became [UNK]. */
  matched: string[] | null;
}

export function encodeWordPiece(
  text: string,
  vocab: WordPieceVocab,
): { tokens: { text: string; id: number }[]; steps: WordPieceStep[] } {
  const unkId = vocab.index.get(UNK) ?? 0;
  const tokens: { text: string; id: number }[] = [];
  const steps: WordPieceStep[] = [];
  for (const word of basicTokenize(text)) {
    const chars = Array.from(word);
    const tried: string[] = [];
    let pieces: string[] | null = [];
    if (chars.length > MAX_WORD_CHARS) pieces = null;
    let start = 0;
    while (pieces && start < chars.length) {
      let end = chars.length;
      let found: string | null = null;
      while (start < end) {
        const sub = (start > 0 ? "##" : "") + chars.slice(start, end).join("");
        if (tried.length < 200) tried.push(sub);
        if (vocab.index.has(sub)) {
          found = sub;
          break;
        }
        end--;
      }
      if (!found) pieces = null;
      else {
        pieces.push(found);
        start = end;
      }
    }
    steps.push({ word, tried, matched: pieces });
    if (pieces) for (const p of pieces) tokens.push({ text: p, id: vocab.index.get(p)! });
    else tokens.push({ text: UNK, id: unkId });
  }
  return { tokens, steps };
}
