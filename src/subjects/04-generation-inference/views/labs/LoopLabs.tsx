/** Concept labs for Module 04, step 4 (the generation loop). Real GPT-2 small recordings and CPU timings. */
import { useState } from "react";
import { Bar, Panel, Segmented, Slider, Stat } from "../../../../components/ui";
import { GEN, fmt, show } from "../../data/gen";
import { repeatedTokens } from "./DecodingLabs";

const vis = (t: string) => t.replace(/\n/g, "↵");

/* ------------------------------------------------------------------ the loop */

/** Lab: step through GPT-2's real greedy loop (with the cache: one token fed after the prompt). */
export function LoopStepsLab() {
  const steps = GEN.kv.steps_cache;
  const [n, setN] = useState(1);
  const s = steps[n - 1]!;
  const text = steps.slice(0, n).map((x) => x.token).join("");
  return (
    <Panel title={`The loop on "${GEN.kv.prompt}" (GPT-2 small, greedy, real)`}>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setN((v) => Math.max(1, v - 1))} disabled={n === 1} className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-200 disabled:opacity-40">
          Back
        </button>
        <button type="button" onClick={() => setN((v) => Math.min(steps.length, v + 1))} disabled={n === steps.length} className="rounded-md bg-sky-500 px-2.5 py-1 text-xs font-medium text-slate-950 disabled:opacity-40">
          Next step
        </button>
        <span className="text-xs text-slate-400">step {n} of {steps.length}</span>
      </div>
      <p className="mt-3 whitespace-pre-wrap rounded bg-slate-950/40 p-2 text-sm">
        <span className="text-slate-400">{GEN.kv.prompt}</span>
        <span className="text-slate-100">{text.slice(0, text.length - s.token.length)}</span>
        <span className="rounded bg-amber-500/30 text-amber-100">{s.token === "\n" ? "↵\n" : s.token}</span>
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="tokens fed" value={String(s.fed)} />
        <Stat label="context" value={String(s.context)} />
        <Stat label="probability" value={`${(100 * s.prob).toFixed(1)}%`} tone={s.prob > 0.9 ? "good" : s.prob < 0.1 ? "warn" : "neutral"} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        Step {n}: fed {s.fed} token{s.fed === 1 ? "" : "s"}, attended to {s.context}, chose {show(s.token)} at {(100 * s.prob).toFixed(1)}%.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ stopping rules */

const LOAN = GEN.greedy["Your loan application has been"]!;
const STOPS = [
  { value: "none", label: "none", s: "" },
  { value: "blank", label: "\\n\\n", s: "\n\n" },
  { value: "dot", label: ".", s: "." },
  { value: "call", label: "1-800", s: "1-800" },
] as const;
type StopKey = (typeof STOPS)[number]["value"];

/** What the caller receives: generate up to maxNew tokens, then cut at the first stop sequence in the decoded text. */
export function runStops(tokens: string[], maxNew: number, stop: string): { text: string; reason: "stop" | "length"; used: number } {
  let text = "";
  for (let i = 0; i < Math.min(maxNew, tokens.length); i++) {
    text += tokens[i];
    const at = stop ? text.indexOf(stop) : -1;
    if (at >= 0) return { text: text.slice(0, at), reason: "stop", used: i + 1 };
  }
  return { text, reason: "length", used: Math.min(maxNew, tokens.length) };
}

/** Lab: max_new_tokens and stop sequences on GPT-2's real greedy reply. */
export function StopRulesLab() {
  const [maxNew, setMaxNew] = useState(40);
  const [stop, setStop] = useState<StopKey>("blank");
  const r = runStops(LOAN.tokens, maxNew, STOPS.find((x) => x.value === stop)!.s);
  return (
    <Panel title="Stopping rules on GPT-2's real greedy reply">
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="max_new_tokens" min={1} max={40} step={1} value={maxNew} onChange={setMaxNew} />
        <Segmented label="Stop sequence" value={stop} options={STOPS.map((x) => ({ value: x.value, label: x.label }))} onChange={setStop} />
      </div>
      <p className="mt-3 whitespace-pre-wrap rounded bg-slate-950/40 p-2 text-sm">
        <span className="text-slate-400">Your loan application has been</span>
        <span className="text-slate-100">{r.text}</span>
      </p>
      <p role="status" className="mt-2 text-sm text-slate-100">
        finish_reason "{r.reason}" after {r.used} token{r.used === 1 ? "" : "s"}; the caller receives {r.text.length} characters.
      </p>
      <p className="mt-1 text-xs text-slate-400">GPT-2 never produced &lt;|endoftext|&gt; (id {GEN.eos.id}) in these 40 tokens, so only your rules can stop it. The stop sequence itself is not returned.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ prefill vs decode */

const T = GEN.kv.timing;
const LENGTHS = T.prefill_by_length.map((p) => String(p.tokens));

/** Lab: measured prefill time per prompt length and a decode step (CPU, 4 threads), combined into a latency estimate. */
export function PrefillDecodeLab() {
  const [len, setLen] = useState("512");
  const [out, setOut] = useState(100);
  const prefill = T.prefill_by_length.find((p) => String(p.tokens) === len)!.ms;
  const decode = out * T.decode_ms_median_cache;
  const total = prefill + decode;
  return (
    <Panel title="Prefill vs decode (GPT-2 small, measured on a CPU)">
      <div className="grid gap-3 sm:grid-cols-2">
        <Segmented label="Prompt tokens" value={len} options={LENGTHS.map((v) => ({ value: v, label: fmt(Number(v)) }))} onChange={setLen} />
        <Slider label="Answer tokens" min={1} max={300} step={1} value={out} onChange={setOut} />
      </div>
      <div className="mt-3 space-y-1.5">
        <Bar label={`prefill ${fmt(Number(len))}`} value={prefill} max={total} display={`${(prefill / 1000).toFixed(2)} s`} color="var(--color-sky-400)" />
        <Bar label={`decode ${out}`} value={decode} max={total} display={`${(decode / 1000).toFixed(2)} s`} color="var(--color-amber-400)" />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        First token after about {(prefill / 1000).toFixed(2)} s; done after about {(total / 1000).toFixed(2)} s. The answer is {Math.round((100 * out) / (out + Number(len)))}% of the tokens and {Math.round((100 * decode) / total)}% of the time.
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Prefill: best of 3 runs per length. Decode: the median step with the KV cache at 512 tokens of context ({T.decode_ms_median_cache} ms), assumed constant. Real numbers from one CPU with {T.cpu_threads} threads; a GPU is far faster but keeps the same shape.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ repetition penalties */

const PEN = Object.keys(GEN.penalties);

/** Lab: GPT-2's greedy loop with no penalty, a repetition penalty and a no-repeat n-gram rule (real recordings). */
export function RepetitionLab() {
  const [k, setK] = useState(PEN[0]!);
  const c = GEN.penalties[k]!;
  const rep = repeatedTokens(c.tokens);
  return (
    <Panel title={`Penalties on "The cat sat on the" (GPT-2 small, greedy, real)`}>
      <Segmented label="Setting" value={k} options={PEN.map((v) => ({ value: v, label: v }))} onChange={setK} />
      <p className="mt-3 text-sm leading-7">
        {c.tokens.map((t, i) => (
          <span key={i} className={rep.has(i) ? "rounded bg-rose-500/25 text-rose-100" : "text-slate-100"}>
            {vis(t)}
          </span>
        ))}
      </p>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {k}: {rep.size} of {c.tokens.length} tokens inside a repeated 4-token phrase; log-probability {c.logprob}.
      </p>
      <p className="mt-1 text-xs text-slate-400">Log-probability under the plain model: lower means the text is one the model finds less natural.</p>
    </Panel>
  );
}
