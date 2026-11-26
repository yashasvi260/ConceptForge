/** Concept labs for Module 01, step 6 ("Dense embeddings"). */
import { Play, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel, Slider } from "../../../components/ui";
import { bagOfWords } from "../bow";
import minilm from "../deep/data/minilm.json";
import { ProbBars } from "./labkit";

const SENT = minilm.sentences as Record<string, number[]>;
const NAMES = Object.keys(SENT);
const btn = "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-slate-500";
const cos = (x: number[], y: number[]) => {
  let d = 0;
  let a = 0;
  let b = 0;
  x.forEach((v, i) => {
    d += v * y[i]!;
    a += v * v;
    b += y[i]! * y[i]!;
  });
  return d / Math.sqrt(a * b);
};

function SentencePicker({ value, onChange, label }: { value: string; onChange: (s: string) => void; label: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-400">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100">
        {NAMES.map((n) => (
          <option key={n}>{n}</option>
        ))}
      </select>
    </label>
  );
}

/* ------------------------------------------------------------------ dense vs sparse */

/** Lab: the same sentence as a sparse word-count vector and as MiniLM's real dense vector. */
export function DenseSparseLab() {
  const [s, setS] = useState(NAMES[0]!);
  const { vocab, counts } = useMemo(() => bagOfWords(NAMES), []);
  const row = counts[NAMES.indexOf(s)]!;
  const v = SENT[s]!;
  const max = Math.max(...v.map(Math.abs));
  return (
    <Panel title="Sparse counts vs a dense embedding">
      <SentencePicker label="Sentence" value={s} onChange={setS} />
      <h4 className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Word counts over the 14 sentences&apos; vocabulary</h4>
      <div aria-label="Sparse vector" className="mt-1 flex flex-wrap gap-0.5">
        {row.map((c, i) => (
          <span key={i} title={`${vocab[i]}: ${c}`} className={`h-4 w-2.5 rounded-sm ${c ? "bg-violet-500" : "bg-slate-800"}`} />
        ))}
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {row.filter(Boolean).length} non-zero of {row.length}. Each square is one word (hover to see it).
      </p>
      <h4 className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">MiniLM&apos;s real 384 numbers</h4>
      <div aria-label="Dense vector" className="mt-1 flex flex-wrap gap-px">
        {v.map((x, i) => (
          <span
            key={i}
            title={`dimension ${i}: ${x.toFixed(4)}`}
            className={`h-3 w-1.5 ${x >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
            style={{ opacity: 0.15 + (0.85 * Math.abs(x)) / max }}
          />
        ))}
      </div>
      <p role="status" className="mt-1 text-xs text-slate-400">
        {v.filter((x) => x !== 0).length} non-zero of {v.length} (stored at 4 decimals). Green positive, red negative; no single dimension means a word.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ contrastive training (toy) */

type Pt = [number, number];
const TOY_START: Pt[] = [
  [-0.8, 0.7],
  [0.7, -0.6],
  [0.6, 0.8],
  [-0.7, -0.8],
  [0.1, 0.9],
  [0.2, -0.9],
];
const TOY_LABELS = ["film was great", "movie was excellent", "reset my password", "forgot my login", "rates rose", "interest went up"];
const PAIRS: [number, number][] = [
  [0, 1],
  [2, 3],
  [4, 5],
];

export function contrastiveStep(p: Pt[], lr: number): Pt[] {
  const next = p.map((x) => [...x] as Pt);
  const isPair = (i: number, j: number) => PAIRS.some(([a, b]) => (a === i && b === j) || (a === j && b === i));
  for (let i = 0; i < p.length; i++)
    for (let j = 0; j < p.length; j++) {
      if (i === j) continue;
      const dx = p[j]![0] - p[i]![0];
      const dy = p[j]![1] - p[i]![1];
      const dist = Math.hypot(dx, dy) || 1e-6;
      // Related pairs pull together; unrelated points push apart while closer than 1.
      const f = isPair(i, j) ? lr : dist < 1 ? -lr * (1 - dist) : 0;
      next[i]![0] += f * dx;
      next[i]![1] += f * dy;
    }
  return next;
}

/** Lab: a toy picture of how an embedding model is trained: related pairs pulled together, others pushed apart. */
export function ContrastiveLab() {
  const [pts, setPts] = useState<Pt[]>(TOY_START);
  const [steps, setSteps] = useState(0);
  const pairDist = PAIRS.map(([a, b]) => Math.hypot(pts[a]![0] - pts[b]![0], pts[a]![1] - pts[b]![1]));
  const S = 90;
  const colors = ["fill-violet-400", "fill-emerald-400", "fill-amber-400"];
  return (
    <Panel title="Training an embedding space (toy, 2 dimensions)">
      <svg viewBox="-110 -110 220 220" role="img" aria-label="Six sentences as points" className="mx-auto h-56 w-full max-w-xs">
        <rect x="-110" y="-110" width="220" height="220" className="fill-slate-950/40" />
        {pts.map((p, i) => {
          const pair = PAIRS.findIndex(([a, b]) => a === i || b === i);
          return (
            <g key={i}>
              <circle cx={p[0] * S} cy={-p[1] * S} r="5" className={colors[pair]} />
              <text x={p[0] * S + 7} y={-p[1] * S + 3} className="fill-slate-300 text-[8px]">
                {TOY_LABELS[i]}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={() => { setPts((p) => Array.from({ length: 5 }).reduce<Pt[]>((q) => contrastiveStep(q, 0.08), p)); setSteps((s) => s + 5); }}>
          <Play size={14} aria-hidden="true" /> Train 5 steps
        </button>
        <button type="button" className={btn} onClick={() => { setPts(TOY_START); setSteps(0); }}>
          <RotateCcw size={14} aria-hidden="true" /> Reset
        </button>
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        After {steps} steps, average distance between related pairs: <span className="font-mono text-violet-300">{(pairDist.reduce((a, b) => a + b, 0) / 3).toFixed(2)}</span>
      </p>
      <p className="mt-1 text-[11px] text-slate-500">A toy with 2 numbers per sentence so you can see it; MiniLM does this with 384 numbers and over a billion real sentence pairs.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ nearest neighbours */

/** Lab: rank the other sentences by real MiniLM cosine to the one you pick. */
export function NeighboursLab() {
  const [q, setQ] = useState("How do I reset my password?");
  const ranked = NAMES.filter((n) => n !== q)
    .map((n) => ({ n, c: cos(SENT[q]!, SENT[n]!) }))
    .sort((a, b) => b.c - a.c);
  return (
    <Panel title="Nearest neighbours (real MiniLM vectors)">
      <SentencePicker label="Query" value={q} onChange={setQ} />
      <div className="mt-3">
        <ProbBars label="Most similar first" format={(v) => v.toFixed(3)} items={ranked.slice(0, 6).map((r, i) => ({ label: r.n, value: Math.max(0, r.c), highlight: i === 0 }))} />
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Scores are cosines of real all-MiniLM-L6-v2 vectors. They&apos;re relative: compare them with each other, not with 1.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ what mean pooling loses */

const TOKENS_A: [string, Pt][] = [
  ["dog", [0.9, 0.2]],
  ["bites", [0.1, 0.8]],
  ["man", [0.4, -0.6]],
];

/** Lab: averaging token vectors gives the same result in any order; and MiniLM's real score for dog/man. */
export function PoolingLossLab() {
  const [reversed, setReversed] = useState(false);
  const seq = reversed ? [...TOKENS_A].reverse() : TOKENS_A;
  const mean: Pt = [seq.reduce((s, [, p]) => s + p[0], 0) / 3, seq.reduce((s, [, p]) => s + p[1], 0) / 3];
  const real = cos(SENT["Dog bites man"]!, SENT["Man bites dog"]!);
  const [w, setW] = useState(1);
  return (
    <Panel title="What averaging throws away">
      <button type="button" className={btn} onClick={() => setReversed((r) => !r)}>
        Swap to “{(reversed ? TOKENS_A : [...TOKENS_A].reverse()).map(([t]) => t).join(" ")}”
      </button>
      <p className="mt-2 text-sm text-slate-200">
        Sentence: <span className="font-mono">{seq.map(([t]) => t).join(" ")}</span>
      </p>
      <p role="status" className="mt-1 font-mono text-sm text-violet-300">
        average of the token vectors = [{mean[0].toFixed(3)}, {mean[1].toFixed(3)}]
      </p>
      <p className="mt-1 text-xs text-slate-400">Same numbers whichever way round: an average doesn&apos;t know about order. (Toy 2-number vectors.)</p>
      <div className="mt-3">
        <Slider label="Weight of the first word" min={1} max={4} step={0.5} value={w} onChange={setW} format={(v) => `×${v}`} hint="Weighting by position is one way to keep some order; plain mean pooling doesn't." />
      </div>
      <p className="mt-1 font-mono text-xs text-slate-300">
        weighted: [{((seq[0]![1][0] * w + seq[1]![1][0] + seq[2]![1][0]) / (w + 2)).toFixed(3)}, {((seq[0]![1][1] * w + seq[1]![1][1] + seq[2]![1][1]) / (w + 2)).toFixed(3)}]
      </p>
      <p className="mt-3 text-sm text-slate-200">
        Real MiniLM, `Dog bites man` vs `Man bites dog`: <span className="font-mono text-rose-300">{real.toFixed(3)}</span>, almost the same vector.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ embedding model vs LLM */

const MINILM_PARAMS = 22_713_216; // computed from all-MiniLM-L6-v2's config.json (BERT-style, 6 layers, width 384)
const GEMMA4_PARAMS = 11.9e9; // Ollama's model details for gemma4:12b

/** Lab: the size and per-token compute of an embedding model and a generative LLM. */
export function EmbedVsLlmLab() {
  const [docs, setDocs] = useState(100_000);
  const tokensPerDoc = 50;
  const flops = (n: number) => 2 * n * tokensPerDoc * docs;
  return (
    <Panel title="Embedding model vs generative LLM">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Two models</caption>
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="py-1 font-medium" />
            <th className="py-1 font-medium">MiniLM</th>
            <th className="py-1 font-medium">gemma4:12b</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-slate-800">
            <th scope="row" className="py-1 text-left font-normal text-slate-400">parameters</th>
            <td className="py-1 font-mono text-slate-100">{MINILM_PARAMS.toLocaleString("en-US")}</td>
            <td className="py-1 font-mono text-slate-100">≈ 11,900,000,000</td>
          </tr>
          <tr className="border-t border-slate-800">
            <th scope="row" className="py-1 text-left font-normal text-slate-400">output</th>
            <td className="py-1 text-slate-200">one 384-number vector per text</td>
            <td className="py-1 text-slate-200">a probability for every next token</td>
          </tr>
          <tr className="border-t border-slate-800">
            <th scope="row" className="py-1 text-left font-normal text-slate-400">FLOPs per token (≈ 2 · N)</th>
            <td className="py-1 font-mono text-slate-100">{(2 * MINILM_PARAMS).toExponential(2)}</td>
            <td className="py-1 font-mono text-slate-100">{(2 * GEMMA4_PARAMS).toExponential(2)}</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-3">
        <Slider label="Documents to read once (50 tokens each)" min={1000} max={10_000_000} step={1000} value={docs} onChange={setDocs} format={(v) => v.toLocaleString("en-US")} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        Reading them: MiniLM ≈ {flops(MINILM_PARAMS).toExponential(1)} FLOPs, gemma4 ≈ {flops(GEMMA4_PARAMS).toExponential(1)} FLOPs, about{" "}
        <span className="font-mono text-violet-300">{Math.round(GEMMA4_PARAMS / MINILM_PARAMS)}×</span> more.
      </p>
      <p className="mt-1 text-[11px] text-slate-500">MiniLM&apos;s count is computed from its published config; gemma4&apos;s is Ollama&apos;s reported size. 2·N per token is a rule of thumb (step 4).</p>
    </Panel>
  );
}
