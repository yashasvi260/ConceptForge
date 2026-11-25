/**
 * Class-based TF-IDF (BERTopic, Grootendorst 2022): treat each cluster as one big document.
 * score(t, c) = tf(t, c) · log(1 + A / f(t)), where tf is t's share of the words in cluster c,
 * A is the average number of words per cluster and f(t) is t's count across all clusters.
 */
const STOP = new Set(
  "a an and are as at be been but by can could did do does for from get got had has have how i if in into is it its just me my no not of on or our please so that the their them then there they this to too up us was we were what when where which who why will with would you your am im ive dont can't won't since after every even than all any".split(
    " ",
  ),
);

export function tokenizeWords(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]+/g) ?? []).filter((w) => w.length >= 2 && !STOP.has(w));
}

export function cTfIdf(docsByCluster: string[][], topN: number): { cluster: number; words: { word: string; score: number }[] }[] {
  const counts = docsByCluster.map((docs) => {
    const m = new Map<string, number>();
    for (const d of docs) for (const w of tokenizeWords(d)) m.set(w, (m.get(w) ?? 0) + 1);
    return m;
  });
  const totals = counts.map((m) => [...m.values()].reduce((a, b) => a + b, 0));
  const A = totals.reduce((a, b) => a + b, 0) / Math.max(1, counts.length);
  const f = new Map<string, number>();
  for (const m of counts) for (const [w, c] of m) f.set(w, (f.get(w) ?? 0) + c);
  return counts.map((m, cluster) => ({
    cluster,
    words: [...m.entries()]
      .map(([word, c]) => ({ word, score: (c / Math.max(1, totals[cluster]!)) * Math.log(1 + A / f.get(word)!) }))
      .sort((a, b) => b.score - a.score || a.word.localeCompare(b.word))
      .slice(0, topN),
  }));
}
