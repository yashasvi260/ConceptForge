/** Concept labs for Module 01, step 7 ("Context"). Real MiniLM token vectors from Modules 01 and 02's data. */
import { useState } from "react";
import { Panel, Slider, Toggle } from "../../../components/ui";
import m02 from "../../02-tokens-embeddings/deep/data/minilm.json";
import minilm from "../deep/data/minilm.json";
import { MODEL_CONFIGS, fmt } from "../modelConfigs";
import { ProbBars } from "./labkit";

const BANK = minilm.bank as Record<string, number[]>;
const BANK_NAMES = Object.keys(BANK);
const SENSE = ["money", "money", "river", "river"];
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

/* ------------------------------------------------------------------ four banks */

/** Lab: real contextual vectors for "bank" in four sentences, against what a static table would give. */
export function BankMatrixLab() {
  const [staticTable, setStatic] = useState(false);
  return (
    <Panel title="One word, four sentences">
      <Toggle label="Use a static table instead (one vector per word)" checked={staticTable} onChange={setStatic} />
      <table className="mt-3 w-full text-left text-xs">
        <caption className="sr-only">Cosine similarity of bank vectors</caption>
        <thead className="text-slate-500">
          <tr>
            <th className="py-1 font-medium">bank in…</th>
            {BANK_NAMES.map((n, i) => (
              <th key={n} className="py-1 font-medium">
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BANK_NAMES.map((a, i) => (
            <tr key={a} className="border-t border-slate-800">
              <th scope="row" className="py-1 pr-2 text-left font-normal text-slate-200">
                {i + 1}. {a} <span className="text-slate-500">({SENSE[i]})</span>
              </th>
              {BANK_NAMES.map((b) => {
                const v = staticTable ? 1 : cos(BANK[a]!, BANK[b]!);
                return (
                  <td key={b} className="py-1 font-mono" style={{ color: `rgb(${Math.round(120 + 135 * v)}, ${Math.round(80 + 60 * v)}, 220)` }}>
                    {v.toFixed(3)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p role="status" className="mt-2 text-sm text-slate-300">
        {staticTable ? "Static: every bank is the identical vector, so every score is 1.000. No way to tell money from rivers." : "Contextual (real MiniLM): the vectors differ by sentence, and the two river banks are the closest pair."}
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ mixing in context (toy) */

const WORDS: Record<string, [number, number]> = {
  cash: [1, 0],
  loan: [0.9, 0.1],
  deposited: [0.9, 0],
  river: [0, 1],
  flooded: [0.1, 0.9],
  picnic: [0.2, 0.6],
  the: [0.3, 0.3],
};

/** Lab: the worked example's toy, (money, water) vectors; mix "bank" with neighbours, equally or with attention-style weights. */
export function ContextMixLab() {
  const [neighbours, setNeighbours] = useState<string[]>(["cash", "loan"]);
  const [focus, setFocus] = useState(1);
  const bank: [number, number] = [0.5, 0.5];
  const vecs: [number, number][] = [bank, ...neighbours.map((w) => WORDS[w]!)];
  const weights = [1, ...neighbours.map((_, i) => (i === 0 ? focus : 1))];
  const z = weights.reduce((a, b) => a + b, 0);
  const mixed: [number, number] = [vecs.reduce((s, v, i) => s + v[0] * weights[i]!, 0) / z, vecs.reduce((s, v, i) => s + v[1] * weights[i]!, 0) / z];
  const toggle = (w: string) => setNeighbours((n) => (n.includes(w) ? n.filter((x) => x !== w) : [...n, w].slice(-3)));
  return (
    <Panel title="Building context: mix bank with its neighbours (toy)">
      <div role="group" aria-label="Neighbouring words" className="flex flex-wrap gap-1.5">
        {Object.keys(WORDS).map((w) => (
          <button key={w} type="button" aria-pressed={neighbours.includes(w)} onClick={() => toggle(w)} className={`rounded-full border px-2.5 py-0.5 font-mono text-xs ${neighbours.includes(w) ? "border-violet-500 bg-violet-500/15 text-violet-200" : "border-slate-700 text-slate-400"}`}>
            {w}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <Slider label={`Attention on “${neighbours[0] ?? "—"}”`} min={0} max={5} step={0.5} value={focus} onChange={setFocus} format={(v) => `×${v}`} hint="1 = every word gets an equal vote (the worked example). Attention learns unequal votes." />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        bank = (0.5, 0.5) → after mixing: <span className="font-mono text-violet-300">({mixed[0].toFixed(2)} money, {mixed[1].toFixed(2)} water)</span>
        {" — "}
        {mixed[0] > mixed[1] + 0.1 ? "the money sense" : mixed[1] > mixed[0] + 0.1 ? "the river sense" : "still undecided"}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Hand-made 2-number vectors (money-ness, water-ness), the same as the worked example. Real models learn hundreds of dimensions.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ how far context reaches */

const REACH_WORDS = ["the", "bank", "of", "the", "river"];

/** Lab: what fits in real context windows, the cost of attending to everything, and causal vs two-sided context. */
export function ContextReachLab() {
  const [tokens, setTokens] = useState(3000);
  const [twoSided, setTwoSided] = useState(false);
  const bankAt = 1;
  return (
    <Panel title="How far context reaches">
      <Slider label="Document length (tokens)" min={100} max={20000} step={100} value={tokens} onChange={setTokens} format={fmt} />
      <ul className="mt-2 space-y-1 text-sm">
        {MODEL_CONFIGS.map((m) => (
          <li key={m.id} className={m.context >= tokens ? "text-emerald-300" : "text-rose-300"}>
            {m.name} (window {fmt(m.context)}): {m.context >= tokens ? "fits in one pass" : `only the last ${fmt(m.context)} tokens fit`}
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-slate-400">Attention compares every pair: {fmt(tokens)}² ≈ {(tokens * tokens).toExponential(1)} scores per head, per block.</p>
      <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">What can “bank” see?</h4>
      <Toggle label="Two-sided context (encoder) instead of left-only (decoder)" checked={twoSided} onChange={setTwoSided} />
      <p role="status" className="mt-2 flex flex-wrap gap-1.5">
        {REACH_WORDS.map((w, i) => {
          const seen = twoSided || i <= bankAt;
          return (
            <span key={i} className={`rounded border px-1.5 py-0.5 font-mono text-xs ${i === bankAt ? "border-violet-500 text-violet-200" : seen ? "border-emerald-500/60 text-emerald-200" : "border-slate-800 text-slate-600 line-through"}`}>
              {w}
            </span>
          );
        })}
      </p>
      <p className="mt-1 text-xs text-slate-400">{twoSided ? "An encoder's bank sees river, so it can settle the meaning at once." : "A decoder's bank can't see river yet: the meaning only settles at later tokens."}</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ token vectors → sentence vector (real) */

const POOL = (m02 as { pool: Record<string, { tokens: string[]; vectors: number[][]; sentence: number[] }> }).pool["The bank approved the loan"]!;

/** Lab: MiniLM's real token vectors for one sentence, and their average, which is its sentence vector. */
export function TokenSentenceLab() {
  const [focus, setFocus] = useState(2);
  const mean = POOL.vectors[0]!.map((_, i) => POOL.vectors.reduce((s, v) => s + v[i]!, 0) / POOL.vectors.length);
  return (
    <Panel title="Token vectors and the sentence vector (real MiniLM)">
      <div role="group" aria-label="Token" className="flex flex-wrap gap-1.5">
        {POOL.tokens.map((t, i) => (
          <button key={i} type="button" aria-pressed={i === focus} onClick={() => setFocus(i)} className={`rounded border px-1.5 py-0.5 font-mono text-xs ${i === focus ? "border-violet-500 bg-violet-500/15 text-violet-200" : "border-slate-700 text-slate-300"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <ProbBars
          label={`How similar each token is to ${POOL.tokens[focus]}`}
          format={(v) => v.toFixed(2)}
          items={POOL.tokens.map((t, i) => ({ label: `${i}: ${t}`, value: Math.max(0, cos(POOL.vectors[focus]!, POOL.vectors[i]!)), highlight: i === focus }))}
        />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        Average of all {POOL.tokens.length} token vectors vs MiniLM&apos;s own sentence vector: cosine <span className="font-mono text-emerald-300">{cos(mean, POOL.sentence).toFixed(4)}</span>
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ word sense by example (real) */

/** Lab: label each "bank" by its nearest labelled example among the others (leave-one-out), on real vectors. */
export function SenseByExampleLab() {
  const results = BANK_NAMES.map((q, i) => {
    const others = BANK_NAMES.map((n, j) => ({ n, j, c: cos(BANK[q]!, BANK[n]!) })).filter((o) => o.j !== i);
    const best = others.reduce((a, b) => (b.c > a.c ? b : a));
    return { q, guess: SENSE[best.j]!, truth: SENSE[i]!, via: best.n, c: best.c };
  });
  const right = results.filter((r) => r.guess === r.truth).length;
  return (
    <Panel title="Word sense by example (real MiniLM vectors)">
      <ol className="space-y-1.5 text-sm">
        {results.map((r) => (
          <li key={r.q} className={`rounded-lg border px-2 py-1.5 ${r.guess === r.truth ? "border-emerald-500/50 text-emerald-100" : "border-rose-500/50 text-rose-100"}`}>
            <span className="font-medium">{r.q}</span> → guessed <span className="font-mono">{r.guess}</span> (nearest: “{r.via}”, {r.c.toFixed(3)}) {r.guess === r.truth ? "✓" : `✗ really ${r.truth}`}
          </li>
        ))}
      </ol>
      <p role="status" className="mt-2 text-sm text-slate-200">
        {right} of {results.length} right.
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Each bank is labelled by its closest neighbour among the other three. Real systems store many labelled examples, not three.</p>
    </Panel>
  );
}
