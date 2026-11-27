/** Concept labs for Module 04, step 7 (the recap mini-project). */
import { useMemo, useState } from "react";
import { Bar, Panel, Toggle } from "../../../../components/ui";
import { GEN, fmt, probAt, show } from "../../data/gen";
import { chain } from "./TruncationLabs";

const pct = (x: number) => `${(100 * x).toFixed(1)}%`;

/* ------------------------------------------------------------------ one step, end to end */

const FR = GEN.dists[0]!;
const DEFAULTS = { temperature: 0.8, topK: 40, topP: 0.9, minP: 0 };

/** Lab: one real step on "The capital of France is" through every stage at Ollama's defaults, then real draws. */
export function StepTraceLab() {
  const r = useMemo(() => chain(FR.top.map((t) => t.logit), DEFAULTS), []);
  const full = FR.top.map((t) => probAt(FR, t.logit, DEFAULTS.temperature));
  const [draws, setDraws] = useState<number[]>([]);
  const paris = FR.top.findIndex((t) => t.token === " Paris");
  const draw = () => {
    let u = Math.random();
    for (const [i, p] of r.probs.entries()) {
      u -= p;
      if (u < 0) return i;
    }
    return 0;
  };
  const counts = new Map<number, number>();
  for (const d of draws) counts.set(d, (counts.get(d) ?? 0) + 1);
  const stages: [string, string][] = [
    ["final vector h", `${GEN.lm_head.h.length} numbers, length ${GEN.lm_head.h_norm.toFixed(1)}`],
    ["logits h · Wᵀ", `${fmt(GEN.config.vocab)} scores; top ${show(FR.top[0]!.token)} at ${FR.top[0]!.logit}`],
    ["÷ temperature 0.8, softmax", `${show(FR.top[0]!.token)} ${pct(full[0]!)} of all ${fmt(GEN.config.vocab)}`],
    ["top-k 40", `${r.counts[0]} tokens holding ${pct(full.reduce((a, b) => a + b, 0))}`],
    ["top-p 0.9", `${r.counts[1]} tokens`],
    ["draw", `${show(FR.top[0]!.token)} ${pct(r.probs[0]!)}, ${show(" Paris")} ${pct(r.probs[paris]!)}`],
  ];
  return (
    <Panel title={`One real step: "${FR.prompt}" (GPT-2 small, Ollama's default settings)`}>
      <ol className="space-y-1 text-sm">
        {stages.map(([k, v], i) => (
          <li key={k} className="flex flex-wrap justify-between gap-x-3 border-t border-slate-800 py-1">
            <span className="text-slate-400">
              {i + 1}. {k}
            </span>
            <span className="font-mono text-slate-100">{v}</span>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setDraws((d) => [...d, ...Array.from({ length: 20 }, draw)])} className="rounded-md bg-sky-500 px-2.5 py-1 text-xs font-medium text-slate-950">
          Draw 20 tokens
        </button>
        <button type="button" onClick={() => setDraws([])} className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-200">
          Clear
        </button>
        <span className="text-xs text-slate-400">{draws.length} drawn</span>
      </div>
      {draws.length > 0 && (
        <div className="mt-2 space-y-1">
          {[...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([i, c]) => (
            <Bar key={i} label={show(FR.top[i]!.token)} value={c} max={draws.length} display={`${c} (${pct(c / draws.length)})`} color="var(--color-emerald-400)" />
          ))}
        </div>
      )}
      <p role="status" className="mt-2 text-sm text-slate-100">
        At T 0.8, top-k 40, top-p 0.9: {r.counts[1]} tokens can be drawn; {show(FR.top[0]!.token)} {pct(r.probs[0]!)}, {show(" Paris")} {pct(r.probs[paris]!)}.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ the cache twin (a made-up model) */

/** Seeded random numbers (mulberry32) and normals (Box–Muller), so the made-up model is the same on every visit. */
function rng(seed: number) {
  let a = seed >>> 0;
  const u = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u());
}

type M = number[][];
const VOCAB = 12;
const D = 16;
const mat = (r: () => number, rows: number, cols: number, scale = 1): M => Array.from({ length: rows }, () => Array.from({ length: cols }, () => r() * scale));
const mul = (a: number[], W: M) => W[0]!.map((_, j) => a.reduce((s, v, i) => s + v * W[i]![j]!, 0));
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i]!, 0);

const R = rng(7);
const E = mat(R, VOCAB, D);
const POS = mat(R, 32, D, 0.5);
const WQ = mat(R, D, D, 1 / Math.sqrt(D));
const WK = mat(R, D, D, 1 / Math.sqrt(D));
const WV = mat(R, D, D, 1 / Math.sqrt(D));
const WO = mat(R, D, VOCAB);

interface Cache { K: number[][]; V: number[][] }

/** One attention layer: run the new tokens at positions start…, append their K and V, return the last logits. */
function forward(ids: number[], start: number, cache: Cache): number[] {
  const X = ids.map((t, i) => E[t]!.map((v, k) => v + POS[start + i]![k]!));
  for (const x of X) {
    cache.K.push(mul(x, WK));
    cache.V.push(mul(x, WV));
  }
  const x = X[X.length - 1]!;
  const q = mul(x, WQ);
  const s = cache.K.map((k) => dot(q, k) / Math.sqrt(D)); // the last new token may see every cached key
  const m = Math.max(...s);
  const w = s.map((v) => Math.exp(v - m));
  const tot = w.reduce((a, b) => a + b, 0);
  const h = x.map((v, k) => v + cache.V.reduce((acc, val, j) => acc + (w[j]! / tot) * val[k]!, 0));
  return mul(h, WO);
}

const argmax = (z: number[]) => z.indexOf(Math.max(...z));

/** Greedy generation on the made-up model. mode "broken" feeds the newest token at position 0 (a classic cache bug). */
export function twinGenerate(prompt: number[], n: number, mode: "cache" | "none" | "broken"): { ids: number[]; fed: number } {
  const ids = [...prompt];
  let cache: Cache = { K: [], V: [] };
  let fed = 0;
  for (let step = 0; step < n; step++) {
    let z: number[];
    if (mode !== "none" && step > 0) {
      z = forward(ids.slice(-1), mode === "broken" ? 0 : ids.length - 1, cache);
      fed += 1;
    } else {
      cache = { K: [], V: [] };
      z = forward(ids, 0, cache);
      fed += ids.length;
    }
    ids.push(argmax(z));
  }
  return { ids: ids.slice(prompt.length), fed };
}

const PROMPT = [3, 1, 4];
const N = 12;

/** Lab: the same made-up model generating with and without a cache, live in the browser; optionally with a bug. */
export function CacheTwinLab() {
  const [broken, setBroken] = useState(false);
  const plain = useMemo(() => twinGenerate(PROMPT, N, "none"), []);
  const cached = useMemo(() => twinGenerate(PROMPT, N, broken ? "broken" : "cache"), [broken]);
  const diverge = cached.ids.findIndex((t, i) => t !== plain.ids[i]);
  return (
    <Panel title="Cache twin: a made-up model (random weights), computed in your browser">
      <Toggle label="Break the cache" checked={broken} onChange={setBroken} description="feed the newest token at position 0 instead of its real position" />
      <table className="mt-3 w-full text-left text-sm">
        <caption className="sr-only">Generated token ids</caption>
        <tbody>
          {[
            ["without a cache", plain],
            [broken ? "broken cache" : "with the cache", cached],
          ].map(([label, r]) => {
            const x = r as typeof plain;
            return (
              <tr key={label as string} className="border-t border-slate-800 align-top">
                <td className="py-1 pr-2 text-slate-400">{label as string}</td>
                <td className="py-1 font-mono">
                  {x.ids.map((t, i) => (
                    <span key={i} className={t !== plain.ids[i] ? "rounded bg-rose-500/30 px-0.5 text-rose-100" : "px-0.5 text-slate-100"}>
                      {t}
                    </span>
                  ))}
                </td>
                <td className="py-1 pl-2 text-right font-mono text-slate-400">{x.fed} fed</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {diverge < 0 ? `Same ${N} tokens both ways; ${cached.fed} tokens fed with the cache, ${plain.fed} without.` : `The broken cache diverges at step ${diverge + 1}: token ${cached.ids[diverge]} instead of ${plain.ids[diverge]}.`}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Prompt ids {PROMPT.join(", ")}; vocabulary of {VOCAB}, width {D}, one attention layer, greedy. With GPT-2's real weights the same check gives 20 identical tokens (Run it locally).
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ settings map */

export const SETTINGS = [
  { name: "temperature", ollama: "0.8", hf: "temperature", step: "2", what: "divides the logits before softmax; 0 means greedy", sampling: true },
  { name: "top_k", ollama: "40", hf: "top_k", step: "3", what: "keeps the k most likely tokens", sampling: true },
  { name: "top_p", ollama: "0.9", hf: "top_p", step: "3", what: "keeps the smallest set of tokens holding p of the probability", sampling: true },
  { name: "min_p", ollama: "0.0 (off)", hf: "min_p", step: "3", what: "keeps tokens with at least min_p times the top token's probability", sampling: true },
  { name: "seed", ollama: "0", hf: "set_seed()", step: "2", what: "repeats the same random draws", sampling: true },
  { name: "repeat_penalty", ollama: "1.0 (off)", hf: "repetition_penalty", step: "4", what: "lowers the logits of tokens already in the text", sampling: false },
  { name: "num_predict", ollama: "-1 (no limit)", hf: "max_new_tokens", step: "4", what: "ends the loop after this many new tokens", sampling: false },
  { name: "stop", ollama: "none", hf: "stop_strings", step: "4", what: "ends the reply when one of these strings appears", sampling: false },
  { name: "num_ctx", ollama: "2048 (documented)", hf: "(the model's context limit)", step: "5–6", what: "how many tokens of context, and so of KV cache, to allow", sampling: false },
] as const;

/** Lab: every generation setting from this module, with Ollama's documented default and the lesson that explains it. */
export function SettingsMapLab() {
  const [i, setI] = useState(0);
  const s = SETTINGS[i]!;
  return (
    <Panel title="Every setting you've met (Ollama defaults from its Modelfile docs)">
      <div className="flex flex-wrap gap-1" role="group" aria-label="Setting">
        {SETTINGS.map((x, k) => (
          <button key={x.name} type="button" aria-pressed={k === i} onClick={() => setI(k)} className={`rounded px-2 py-0.5 font-mono text-xs ${k === i ? "bg-sky-500/30 text-sky-100" : x.sampling ? "bg-slate-800 text-emerald-200" : "bg-slate-800 text-amber-200"}`}>
            {x.name}
          </button>
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-slate-400">Ollama default</dt>
        <dd className="font-mono text-slate-100">{s.ollama}</dd>
        <dt className="text-slate-400">Hugging Face</dt>
        <dd className="font-mono text-slate-100">{s.hf}</dd>
        <dt className="text-slate-400">Explained in</dt>
        <dd className="text-slate-100">step {s.step}</dd>
      </dl>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {s.name}: {s.what}. {s.sampling ? "Only matters when sampling (ignored by greedy decoding)." : "Applies to greedy decoding too."}
      </p>
      <p className="mt-1 text-xs text-slate-400">Green: sampling settings; amber: loop and context settings. A model's own configuration can override these defaults; set them explicitly when results matter.</p>
    </Panel>
  );
}
