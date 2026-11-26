/** Concept labs for Module 01, step 12 (the recap mini-project), mirroring its Python exactly. */
import { Dices } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel, Segmented, Slider } from "../../../components/ui";
import { MODEL_CONFIGS, fmt, paramBreakdown } from "../modelConfigs";
import { pct, ProbBars } from "./labkit";

export const GENERAL = `The cat sat on the mat. The dog sat on the rug. The cat ate the fish.
The dog ate the bone. A bird sat on the tree. The bird ate the seed.`;
export const BANKING = `The bank approved the loan. The customer repaid the loan. The bank froze the card.
The customer reported the card. The bank refunded the payment.`;
export const HELD_OUT = "The bank approved the payment. The customer froze the card.";

export const tokenize = (t: string) => t.toLowerCase().match(/[a-z']+|[.,!?]/g) ?? [];
export const VOCAB = [...new Set(tokenize(`${GENERAL} ${BANKING} ${HELD_OUT}`))].sort();
type Counts = Map<string, Map<string, number>>;

export function train(tokens: string[]): Counts {
  const c: Counts = new Map();
  for (let i = 0; i + 1 < tokens.length; i++) {
    const row = c.get(tokens[i]!) ?? new Map<string, number>();
    row.set(tokens[i + 1]!, (row.get(tokens[i + 1]!) ?? 0) + 1);
    c.set(tokens[i]!, row);
  }
  return c;
}

/** Add-k smoothing (k = 1 is the mini-project's add-one). */
export function prob(c: Counts, prev: string, next: string, k = 1): number {
  const row = c.get(prev);
  const total = row ? [...row.values()].reduce((a, b) => a + b, 0) : 0;
  const denom = total + k * VOCAB.length;
  return denom === 0 ? 0 : ((row?.get(next) ?? 0) + k) / denom;
}

export function perplexity(c: Counts, tokens: string[], k = 1): number {
  const losses: number[] = [];
  for (let i = 0; i + 1 < tokens.length; i++) losses.push(-Math.log(prob(c, tokens[i]!, tokens[i + 1]!, k)));
  return losses.length ? Math.exp(losses.reduce((a, b) => a + b, 0) / losses.length) : Infinity;
}

const BASE = train(tokenize(GENERAL));
const TUNED = train([...tokenize(GENERAL), ...tokenize(BANKING)]);
const btn = "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-slate-500";

/* ------------------------------------------------------------------ part 1: tokenizer */

/** Lab: the mini-project's word-level tokenizer, and the words its 25-token vocabulary doesn't know. */
export function RecapTokenizeLab() {
  const [text, setText] = useState("The customer froze the account!");
  const toks = tokenize(text);
  const unknown = toks.filter((t) => !VOCAB.includes(t));
  return (
    <Panel title="Part 1: your tokenizer">
      <label className="block text-xs text-slate-400">
        Text
        <input value={text} onChange={(e) => setText(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100" />
      </label>
      <p className="mt-3 flex flex-wrap gap-1.5">
        {toks.map((t, i) => (
          <span key={i} className={`rounded border px-1.5 py-0.5 font-mono text-xs ${VOCAB.includes(t) ? "border-emerald-500/60 text-emerald-200" : "border-rose-500/60 text-rose-200"}`}>
            {t}
          </span>
        ))}
      </p>
      <p role="status" className="mt-2 text-sm text-slate-200">
        {toks.length} tokens; {unknown.length ? `not in the ${VOCAB.length}-token vocabulary: ${unknown.join(", ")}` : `all in the ${VOCAB.length}-token vocabulary`}.
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Red tokens are unknown to a word-level vocabulary. A sub-word tokenizer (Module 02) would spell them from pieces instead.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ part 2: smoothing */

/** Lab: add-k smoothing; never-seen pairs go from impossible to merely unlikely. */
export function SmoothingLab() {
  const [k, setK] = useState(1);
  const [prev, setPrev] = useState("the");
  const words = [...BASE.keys()].sort();
  const top = VOCAB.map((w) => ({ w, p: prob(BASE, prev, w, k) }))
    .sort((a, b) => b.p - a.p)
    .slice(0, 7);
  return (
    <Panel title="Part 2: probabilities that are never zero">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          After the word
          <select value={prev} onChange={(e) => setPrev(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 font-mono text-sm text-slate-100">
            {words.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
        </label>
        <Slider label="Smoothing k (add k to every count)" min={0} max={2} step={0.1} value={k} onChange={setK} format={(v) => v.toFixed(1)} />
      </div>
      <div className="mt-3">
        <ProbBars label={`P(next | ${prev})`} items={top.map((t) => ({ label: t.w, value: t.p }))} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        P(loan | {prev}) = <span className={`font-mono ${prob(BASE, prev, "loan", k) === 0 ? "text-rose-300" : "text-emerald-300"}`}>{prob(BASE, prev, "loan", k).toFixed(4)}</span>
        {prob(BASE, prev, "loan", k) === 0 ? " — impossible: the model can never say it" : " — never seen, but possible"}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">(count + k) / (total + k × {VOCAB.length}). k = 1 is the mini-project&apos;s add-one smoothing.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ part 3: generation with temperature */

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generate(c: Counts, start: string, n: number, temperature: number, rand: () => number): string[] {
  const out = [start];
  for (let i = 0; i < n; i++) {
    const p = VOCAB.map((w) => prob(c, out[out.length - 1]!, w));
    if (temperature === 0) {
      out.push(VOCAB[p.indexOf(Math.max(...p))]!);
      continue;
    }
    const w = p.map((x) => x ** (1 / temperature));
    let r = rand() * w.reduce((a, b) => a + b, 0);
    const idx = w.findIndex((x) => (r -= x) < 0);
    out.push(VOCAB[idx < 0 ? w.length - 1 : idx]!);
  }
  return out;
}

/** Lab: the mini-project's generation loop, greedy or sampled, on the base or fine-tuned model. */
export function RecapGenerateLab() {
  const [temperature, setTemperature] = useState(0);
  const [model, setModel] = useState<"base" | "tuned">("base");
  const [seed, setSeed] = useState(1);
  const out = useMemo(() => generate(model === "base" ? BASE : TUNED, "the", 10, temperature, mulberry(seed)), [temperature, model, seed]);
  return (
    <Panel title="Part 3: the generation loop, with temperature">
      <Segmented<"base" | "tuned"> label="Model" value={model} options={[{ value: "base", label: "Pre-trained (general text)" }, { value: "tuned", label: "Fine-tuned (+ banking)" }]} onChange={setModel} />
      <div className="mt-2">
        <Slider label="Temperature" min={0} max={2} step={0.1} value={temperature} onChange={setTemperature} format={(v) => (v === 0 ? "0 (greedy)" : v.toFixed(1))} />
      </div>
      <button type="button" className={`${btn} mt-2`} onClick={() => setSeed((s) => s + 1)} disabled={temperature === 0}>
        <Dices size={14} aria-hidden="true" /> Sample again
      </button>
      <p role="status" className="mt-3 font-mono text-sm text-emerald-300">
        {out.join(" ")}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Greedy repeats itself; sampling with smoothing can produce pairs never seen in training.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ part 4: perplexity */

/** Lab: perplexity of the base and fine-tuned model on held-out, training, or your own text. */
export function PerplexityLab() {
  const [which, setWhich] = useState<"held" | "train" | "own">("held");
  const [own, setOwn] = useState("The dog sat on the card.");
  const text = which === "held" ? HELD_OUT : which === "train" ? GENERAL : own;
  const toks = tokenize(text);
  const before = perplexity(BASE, toks);
  const after = perplexity(TUNED, toks);
  return (
    <Panel title="Part 4: perplexity">
      <Segmented<"held" | "train" | "own">
        label="Measure on"
        value={which}
        options={[{ value: "held", label: "Held-out banking text" }, { value: "train", label: "The training text" }, { value: "own", label: "Your text" }]}
        onChange={setWhich}
      />
      {which === "own" && <input aria-label="Your text" value={own} onChange={(e) => setOwn(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100" />}
      <div className="mt-3">
        <ProbBars
          label="Perplexity (lower = less surprised)"
          format={(v) => (v * VOCAB.length).toFixed(2)}
          items={[
            { label: "pre-trained", value: Math.min(1, before / VOCAB.length) },
            { label: "fine-tuned", value: Math.min(1, after / VOCAB.length), highlight: true },
          ]}
        />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        Before {before.toFixed(2)}, after fine-tuning {after.toFixed(2)}. A model that knew nothing would score {VOCAB.length} (the vocabulary size).
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ your model next to a real one */

const llama = MODEL_CONFIGS.find((m) => m.id === "llama3-8b")!;
const ROWS = [
  { what: "vocabulary", yours: VOCAB.length, real: llama.vocab, upgrade: "Module 02: sub-word tokenizers" },
  { what: "context it can see", yours: 1, real: llama.context, upgrade: "Modules 03–04: attention and long context" },
  { what: "learned numbers", yours: VOCAB.length * VOCAB.length, real: paramBreakdown(llama).total, upgrade: "Module 03: the transformer block" },
  { what: "training tokens", yours: tokenize(GENERAL).length + tokenize(BANKING).length, real: llama.trainingTokens!, upgrade: "Module 05: how models learn" },
];

/** Lab: the mini-project next to Llama 3 8B, and which module upgrades each part. */
export function VsRealLab() {
  const [i, setI] = useState(0);
  const r = ROWS[i]!;
  return (
    <Panel title="Your model next to Llama 3 8B">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Comparison</caption>
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="py-1 font-medium" />
            <th className="py-1 font-medium">yours</th>
            <th className="py-1 font-medium">Llama 3 8B</th>
            <th className="py-1 font-medium">× bigger</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((x, k) => (
            <tr key={x.what} onClick={() => setI(k)} className={`cursor-pointer border-t border-slate-800 ${k === i ? "bg-violet-500/10" : ""}`}>
              <th scope="row" className="py-1 text-left font-normal text-slate-300">
                {x.what}
              </th>
              <td className="py-1 font-mono text-slate-100">{fmt(x.yours)}</td>
              <td className="py-1 font-mono text-slate-100">{fmt(x.real)}</td>
              <td className="py-1 font-mono text-violet-300">{fmt(Math.round(x.real / x.yours))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p role="status" className="mt-2 text-sm text-slate-200">
        <span className="font-semibold">{r.what}:</span> {r.upgrade}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Click a row to see where the course upgrades it. Same interface either way: tokens in, a probability for every next token out.</p>
      <p className="mt-1 text-xs text-slate-400">{pct(1 / VOCAB.length)} is the chance of guessing a token blind with your vocabulary.</p>
    </Panel>
  );
}
