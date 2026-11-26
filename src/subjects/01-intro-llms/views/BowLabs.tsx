/** Concept labs for Module 01, step 5 ("Bag-of-Words"). */
import { Shuffle } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel, Slider } from "../../../components/ui";
import { bagOfWords, bowCosine, words } from "../bow";
import minilm from "../deep/data/minilm.json";
import { ProbBars } from "./labkit";

const btn = "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-slate-500";
const cosOf = (a: string, b: string) => {
  const { counts } = bagOfWords([a, b]);
  return bowCosine(counts[0]!, counts[1]!);
};

/* ------------------------------------------------------------------ cosine: angle, not length */

/** Lab: cosine similarity depends on the angle between two vectors, not their lengths. */
export function CosineLab() {
  const [angle, setAngle] = useState(45);
  const [lenA, setLenA] = useState(1);
  const [lenB, setLenB] = useState(2);
  const rad = (angle * Math.PI) / 180;
  const a = [lenA, 0];
  const b = [lenB * Math.cos(rad), lenB * Math.sin(rad)];
  const dot = a[0]! * b[0]! + a[1]! * b[1]!;
  const cos = dot / (lenA * lenB);
  const S = 40;
  return (
    <Panel title="Cosine similarity: the angle, not the length">
      <div className="grid gap-2 sm:grid-cols-3">
        <Slider label="Angle between them" min={0} max={180} step={5} value={angle} onChange={setAngle} format={(v) => `${v}°`} />
        <Slider label="Length of a" min={0.5} max={2.5} step={0.25} value={lenA} onChange={setLenA} format={(v) => v.toFixed(2)} />
        <Slider label="Length of b" min={0.5} max={2.5} step={0.25} value={lenB} onChange={setLenB} format={(v) => v.toFixed(2)} />
      </div>
      <svg viewBox="-110 -110 220 120" role="img" aria-label={`Two arrows ${angle} degrees apart`} className="mx-auto mt-2 h-36 w-full max-w-xs">
        <line x1="-105" y1="0" x2="105" y2="0" className="stroke-slate-700" strokeWidth="1" />
        <line x1="0" y1="0" x2={a[0]! * S} y2={-a[1]! * S} className="stroke-violet-400" strokeWidth="3" />
        <line x1="0" y1="0" x2={b[0]! * S} y2={-b[1]! * S} className="stroke-emerald-400" strokeWidth="3" />
        <text x={a[0]! * S + 4} y={-4} className="fill-violet-300 text-[10px]">a</text>
        <text x={b[0]! * S + 4} y={-b[1]! * S} className="fill-emerald-300 text-[10px]">b</text>
      </svg>
      <p role="status" className="text-sm text-slate-200">
        cos = (a · b) / (|a| · |b|) = {dot.toFixed(2)} / ({lenA.toFixed(2)} × {lenB.toFixed(2)}) = <span className="font-mono text-violet-300">{cos.toFixed(3)}</span>
      </p>
      <p className="mt-1 text-[11px] text-slate-500">0° → 1 (same direction) · 90° → 0 (nothing in common) · 180° → −1 (opposite). Change the lengths: the score doesn&apos;t move.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ word order */

const ORDER_PAIRS = [
  ["Dog bites man", "Man bites dog"],
  ["not good, very bad", "not bad, very good"],
  ["The film was great", "The movie was excellent"],
];

/** Lab: shuffling the words of a sentence leaves its Bag-of-Words vector unchanged. */
export function WordOrderLab({ rand = Math.random }: { rand?: () => number }) {
  const [text, setText] = useState("The bank approved the loan");
  const [shuffled, setShuffled] = useState<string | null>(null);
  const shuffle = () => {
    const ws = text.split(/\s+/).filter(Boolean);
    for (let i = ws.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [ws[i], ws[j]] = [ws[j]!, ws[i]!];
    }
    setShuffled(ws.join(" "));
  };
  return (
    <Panel title="What the bag throws away">
      <label className="block text-xs text-slate-400">
        A sentence
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setShuffled(null);
          }}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
        />
      </label>
      <button type="button" className={`${btn} mt-2`} onClick={shuffle}>
        <Shuffle size={14} aria-hidden="true" /> Shuffle the words
      </button>
      {shuffled && (
        <p role="status" className="mt-2 text-sm text-slate-200">
          “{shuffled}” — Bag-of-Words similarity with the original: <span className="font-mono text-rose-300">{cosOf(text, shuffled).toFixed(3)}</span>. Same bag, scrambled meaning.
        </p>
      )}
      <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Pairs to think about</h4>
      <table className="mt-2 w-full text-left text-sm">
        <caption className="sr-only">Pairs</caption>
        <tbody>
          {ORDER_PAIRS.map(([a, b]) => (
            <tr key={a} className="border-t border-slate-800">
              <td className="py-1 text-slate-200">{a}</td>
              <td className="py-1 text-slate-200">{b}</td>
              <td className="py-1 font-mono text-violet-300">{cosOf(a!, b!).toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

/* ------------------------------------------------------------------ TF-IDF */

export function tfidf(texts: string[]) {
  const { vocab, counts } = bagOfWords(texts);
  const n = texts.length;
  const df = vocab.map((_, i) => counts.filter((r) => r[i]! > 0).length);
  const idf = df.map((d) => Math.log(n / d));
  const weights = counts.map((r) => r.map((c, i) => c * idf[i]!));
  return { vocab, df, idf, weights };
}

const TFIDF_DEFAULT = ["The film was great", "The movie was excellent", "Dog bites man", "Man bites dog"].join("\n");

/** Lab: TF-IDF weights for editable sentences; common words fade, distinctive words stand out. */
export function TfIdfLab() {
  const [text, setText] = useState(TFIDF_DEFAULT);
  const texts = useMemo(() => text.split("\n").map((t) => t.trim()).filter(Boolean).slice(0, 6), [text]);
  const { vocab, df, idf, weights } = useMemo(() => tfidf(texts), [texts]);
  const [row, setRow] = useState(0);
  const r = Math.min(row, texts.length - 1);
  const ws = r >= 0 ? words(texts[r]!) : [];
  const shown = [...new Set(ws)];
  const max = Math.max(1e-9, ...shown.map((w) => weights[r]![vocab.indexOf(w)]!));
  return (
    <Panel title="TF-IDF: weighting the words that matter">
      <label className="block text-xs text-slate-400">
        Documents (one per line, up to 6)
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 font-mono text-sm text-slate-100" />
      </label>
      <div role="group" aria-label="Document to inspect" className="mt-2 flex flex-wrap gap-1.5">
        {texts.map((t, i) => (
          <button key={i} type="button" aria-pressed={i === r} onClick={() => setRow(i)} className={`rounded-full border px-2.5 py-0.5 text-xs ${i === r ? "border-violet-500 bg-violet-500/15 text-violet-200" : "border-slate-700 text-slate-400"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <ProbBars
          label="TF-IDF weight of each word"
          format={(v) => (v * max).toFixed(3)}
          items={shown.map((w) => {
            const i = vocab.indexOf(w);
            return { label: w, value: weights[r]![i]! / max, note: `in ${df[i]} of ${texts.length} documents, idf = ln(${texts.length}/${df[i]}) = ${idf[i]!.toFixed(3)}` };
          })}
        />
      </div>
      <p className="mt-2 text-[11px] text-slate-500">weight = count × ln(N / df). A word in every document gets 0; hover a word to see its numbers.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ where counting still wins */

const DOCS = [
  "Fix ERR_CERT_DATE_INVALID by correcting your device clock",
  "Resetting your password from the login page",
  "Error ERR-4021 means the payment card has expired",
  "How to update the CX-200 router firmware",
  "Why your browser shows a security warning",
];

/** Lab: for exact terms (codes, model numbers) counting the literal word finds exactly the right document. */
export function KeywordWinsLab() {
  const [q, setQ] = useState("ERR-4021");
  const qw = new Set(words(q));
  const ranked = DOCS.map((d) => ({ d, hits: words(d).filter((w) => qw.has(w)).length })).sort((a, b) => b.hits - a.hits);
  return (
    <Panel title="Where counting words still wins">
      <label className="block text-xs text-slate-400">
        Search the help articles
        <input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 font-mono text-sm text-slate-100" />
      </label>
      <ol aria-label="Results" className="mt-3 space-y-1.5">
        {ranked.map(({ d, hits }) => (
          <li key={d} className={`rounded-lg border px-2 py-1.5 text-sm ${hits ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-100" : "border-slate-800 text-slate-400"}`}>
            <span className="mr-2 font-mono text-xs">{hits} match{hits === 1 ? "" : "es"}</span>
            {d}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[11px] text-slate-500">Try `ERR-4021`, `CX-200`, then `my card stopped working`. Exact codes are found instantly; a paraphrase finds little.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ the bridge: counts vs real embeddings */

const SENT = minilm.sentences as Record<string, number[]>;
const BRIDGE_PAIRS: [string, string][] = [
  ["The film was great", "The movie was excellent"],
  ["How do I reset my password?", "I forgot my login details"],
  ["I can't sign in to my account", "How do I reset my password?"],
  ["Dog bites man", "Man bites dog"],
  ["The film was great", "Interest rates rose today"],
];

const dense = (a: string, b: string) => {
  const x = SENT[a]!;
  const y = SENT[b]!;
  let d = 0;
  let nx = 0;
  let ny = 0;
  x.forEach((v, i) => {
    d += v * y[i]!;
    nx += v * v;
    ny += y[i]! * y[i]!;
  });
  return d / Math.sqrt(nx * ny);
};

/** Lab: the same pairs scored by word counts and by real MiniLM sentence embeddings. */
export function BridgeLab() {
  return (
    <Panel title="Counting words vs real embeddings">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Pairs scored two ways</caption>
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="py-1 font-medium">pair</th>
            <th className="py-1 font-medium">word counts</th>
            <th className="py-1 font-medium">MiniLM</th>
          </tr>
        </thead>
        <tbody>
          {BRIDGE_PAIRS.map(([a, b]) => (
            <tr key={a + b} className="border-t border-slate-800">
              <td className="py-1 text-slate-200">
                {a}
                <br />
                <span className="text-slate-400">{b}</span>
              </td>
              <td className="py-1 font-mono text-slate-300">{cosOf(a, b).toFixed(3)}</td>
              <td className="py-1 font-mono text-violet-300">{dense(a, b).toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-slate-500">MiniLM scores are cosines of real all-MiniLM-L6-v2 sentence vectors (computed once and stored). Notice what MiniLM fixes, and what it still gets wrong.</p>
    </Panel>
  );
}
