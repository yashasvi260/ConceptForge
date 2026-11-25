/** Bag-of-Words: a text becomes word counts over a shared vocabulary. Word order is thrown away. */

export function words(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []).map((w) => w.replace(/^'+|'+$/g, "")).filter(Boolean);
}

export function bagOfWords(texts: string[]): { vocab: string[]; counts: number[][] } {
  const vocab: string[] = [];
  const index = new Map<string, number>();
  const tokenized = texts.map(words);
  for (const ws of tokenized) {
    for (const w of ws) {
      if (!index.has(w)) {
        index.set(w, vocab.length);
        vocab.push(w);
      }
    }
  }
  const counts = tokenized.map((ws) => {
    const row = new Array<number>(vocab.length).fill(0);
    for (const w of ws) row[index.get(w)!]! += 1;
    return row;
  });
  return { vocab, counts };
}

export function bowCosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}
