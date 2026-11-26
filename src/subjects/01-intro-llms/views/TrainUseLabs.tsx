/** Concept labs for Module 01, step 4 ("Training vs using a model"). */
import { Play, RotateCcw, StepForward } from "lucide-react";
import { useState } from "react";
import { Panel, Segmented, Slider } from "../../../components/ui";
import { choicesAt, initialLab, labStep, type GenTree } from "../generationLab";
import { MODEL_CONFIGS, fmt, paramBreakdown } from "../modelConfigs";
import { nodeAt, pct, ProbBars, RecordedNote, showToken, useGenRecording, type GenRecording } from "./labkit";

type Load = { load?: () => Promise<GenRecording> };
const btn = "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 disabled:opacity-40";
const loading = (title: string, failed: boolean) => (
  <Panel title={title}>
    <p role="status" className="text-sm text-slate-400">
      {failed ? "Couldn't load the recorded gemma4 data." : "Loading real gemma4 probabilities…"}
    </p>
  </Panel>
);

/* ------------------------------------------------------------------ cross-entropy loss */

const REAL_CASES: { label: string; prompt: number; path: string[]; token: string }[] = [
  { label: "“…capital of France is” → Paris", prompt: 3, path: [], token: "Paris" },
  { label: "“…there was a” → small", prompt: 0, path: [], token: "small" },
  { label: "“…a small” → village", prompt: 0, path: ["small"], token: " village" },
  { label: "“…a small” → cottage", prompt: 0, path: ["small"], token: " cottage" },
];

/** Lab: the loss for one prediction is −ln(probability of the right token); with gemma4's real probabilities. */
export function LossLab({ load }: Load) {
  const { rec, failed } = useGenRecording(load);
  const [p, setP] = useState(0.5);
  if (!rec) return loading("Cross-entropy loss", failed);
  const loss = (q: number) => -Math.log(Math.max(q, 1e-9));
  const W = 260;
  const H = 90;
  const pts = Array.from({ length: 60 }, (_, i) => {
    const q = 0.01 + (i / 59) * 0.99;
    return `${(q * W).toFixed(1)},${(H - (Math.min(loss(q), 4.6) / 4.6) * H).toFixed(1)}`;
  }).join(" ");
  const real = REAL_CASES.map((c) => {
    const t = rec.trees[c.prompt]!;
    const node = nodeAt(t, c.path);
    const q = node === null ? 0 : (choicesAt(t, node, 1).find((x) => x.token === c.token)?.raw ?? 0);
    return { ...c, q, l: loss(q) };
  });
  return (
    <Panel title="Cross-entropy: how wrong was the guess?">
      <Slider label="Probability given to the right token" min={0.01} max={1} step={0.01} value={p} onChange={setP} format={(v) => v.toFixed(2)} />
      <svg viewBox={`-4 -4 ${W + 8} ${H + 8}`} role="img" aria-label="Loss curve: −ln p" className="mt-2 h-28 w-full">
        <polyline points={pts} fill="none" stroke="currentColor" className="text-violet-400" strokeWidth="2" />
        <circle cx={p * W} cy={H - (Math.min(loss(p), 4.6) / 4.6) * H} r="4" className="fill-emerald-400" />
      </svg>
      <p role="status" className="text-sm text-slate-200">
        loss = −ln({p.toFixed(2)}) = <span className="font-mono text-emerald-300">{loss(p).toFixed(3)}</span>
      </p>
      <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">gemma4&apos;s real predictions, scored</h4>
      <table className="mt-2 w-full text-left text-sm">
        <caption className="sr-only">Real losses</caption>
        <tbody>
          {real.map((r) => (
            <tr key={r.label} className="border-t border-slate-800">
              <td className="py-1 text-slate-200">{r.label}</td>
              <td className="py-1 font-mono text-slate-300">p = {pct(r.q)}</td>
              <td className="py-1 font-mono text-violet-300">loss {r.l.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <RecordedNote rec={rec} />
    </Panel>
  );
}

/* ------------------------------------------------------------------ gradient descent */

export function gdStep(w: number, lr: number, x = 2, y = 6) {
  const pred = w * x;
  const loss = (pred - y) ** 2;
  const grad = 2 * (pred - y) * x;
  return { pred, loss, grad, next: w - lr * grad };
}

/** Lab: the worked example's one-weight model, trained step by step. */
export function GradientLab() {
  const [lr, setLr] = useState(0.05);
  const [hist, setHist] = useState<number[]>([1]);
  const w = hist[hist.length - 1]!;
  const s = gdStep(w, lr);
  const step = (n: number) =>
    setHist((h) => {
      const out = [...h];
      for (let i = 0; i < n; i++) out.push(gdStep(out[out.length - 1]!, lr).next);
      return out.slice(-40);
    });
  const blownUp = !Number.isFinite(w) || Math.abs(w) > 1000;
  return (
    <Panel title="Gradient descent on prediction = w · x (x = 2, right answer 6)">
      <Slider label="Learning rate" min={0.01} max={0.35} step={0.01} value={lr} onChange={setLr} format={(v) => v.toFixed(2)} hint="Try 0.05, then 0.2, then 0.3." />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={btn} disabled={blownUp} onClick={() => step(1)}>
          <StepForward size={14} aria-hidden="true" /> One step
        </button>
        <button type="button" className={btn} disabled={blownUp} onClick={() => step(10)}>
          <Play size={14} aria-hidden="true" /> Ten steps
        </button>
        <button type="button" className={btn} onClick={() => setHist([1])}>
          <RotateCcw size={14} aria-hidden="true" /> Reset (w = 1)
        </button>
      </div>
      <p role="status" className={`mt-3 text-sm ${blownUp ? "text-rose-300" : "text-slate-200"}`}>
        {blownUp
          ? "The weight blew up: each step overshoots further than the last. The learning rate is too big."
          : `step ${hist.length - 1}: w = ${w.toFixed(4)}, prediction ${s.pred.toFixed(3)}, loss ${s.loss.toFixed(4)}, gradient ${s.grad.toFixed(3)}`}
      </p>
      <ProbBars
        label="Loss over the steps"
        format={(v) => (v * 16).toFixed(3)}
        items={hist.slice(-8).map((h, i, arr) => ({
          label: `#${hist.length - arr.length + i} w=${Number.isFinite(h) ? h.toFixed(3) : "∞"}`,
          value: Math.min(1, gdStep(h, lr).loss / 16),
          highlight: i === arr.length - 1,
        }))}
      />
      <p className="mt-1 text-[11px] text-slate-500">The ideal weight is 3. Bars show the loss at each of the last 8 weights (16 = the starting loss).</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ frozen weights */

function sampleReply(tree: GenTree, temperature: number, rand: () => number): string {
  let s = initialLab();
  for (let i = 0; i < 80 && !s.stopped; i++) s = labStep(s, tree, { temperature, maxTokens: 12, rand });
  return s.generated.join("");
}

/** Lab: the weights (so the distribution) never change between runs; only the sampling does. */
export function FrozenLab({ load, rand = Math.random }: Load & { rand?: () => number }) {
  const { rec, failed } = useGenRecording(load);
  const [temperature, setTemperature] = useState(1);
  const [replies, setReplies] = useState<string[]>([]);
  if (!rec) return loading("Inference: frozen weights", failed);
  const tree = rec.trees[0]!;
  const first = choicesAt(tree, 0, 1).slice(0, 4);
  return (
    <Panel title="Inference: same weights, every time">
      <p className="text-sm text-slate-300">
        For “{tree.prompt}”, gemma4&apos;s first-token probabilities are the same on every run, because its weights don&apos;t change:
      </p>
      <div className="mt-2">
        <ProbBars label="First-token probabilities (identical every run)" items={first.map((c) => ({ label: showToken(c.token), value: c.raw }))} />
      </div>
      <div className="mt-3">
        <Slider label="Temperature" min={0} max={1.5} step={0.1} value={temperature} onChange={(v) => { setTemperature(v); setReplies([]); }} format={(v) => (v === 0 ? "0 (greedy)" : v.toFixed(1))} />
      </div>
      <button type="button" className={`${btn} mt-2`} onClick={() => setReplies(Array.from({ length: 5 }, () => sampleReply(tree, temperature, rand)))}>
        <Play size={14} aria-hidden="true" /> Generate 5 replies
      </button>
      {replies.length > 0 && (
        <ol aria-label="Five replies" className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-200">
          {replies.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ol>
      )}
      <p role="status" className="mt-2 text-sm text-slate-400">
        {replies.length === 0 ? "" : new Set(replies).size === 1 ? "All five identical: greedy choice on frozen weights is fully repeatable." : `${new Set(replies).size} different replies from the same frozen weights: the variety comes only from sampling.`}
      </p>
      <RecordedNote rec={rec} />
    </Panel>
  );
}

/* ------------------------------------------------------------------ training vs inference compute */

/** Lab: training compute (6·N·D) against inference (2·N per token) at a chosen usage level. */
export function ComputeLab() {
  const models = MODEL_CONFIGS.filter((m) => m.trainingTokens);
  const [id, setId] = useState(models[0]!.id);
  const [perDay, setPerDay] = useState(1000);
  const m = models.find((x) => x.id === id)!;
  const n = paramBreakdown(m).total;
  const train = 6 * n * m.trainingTokens!;
  const token = 2 * n;
  const days = train / (token * perDay * 1e6);
  return (
    <Panel title="Training once vs answering forever">
      <Segmented label="Model" value={id} options={models.map((x) => ({ value: x.id, label: x.name }))} onChange={setId} />
      <dl className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2">
          <dt className="text-[11px] text-slate-500">training ≈ 6 · N · D</dt>
          <dd className="font-mono text-sm text-slate-100">{train.toExponential(2)} FLOPs</dd>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2">
          <dt className="text-[11px] text-slate-500">one token ≈ 2 · N</dt>
          <dd className="font-mono text-sm text-slate-100">{token.toExponential(2)} FLOPs</dd>
        </div>
      </dl>
      <div className="mt-3">
        <Slider label="Tokens generated per day (millions)" min={1} max={100000} step={1} value={perDay} onChange={setPerDay} format={fmt} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        At {fmt(perDay)} million tokens a day, inference matches the training compute after{" "}
        <span className="font-mono text-violet-300">{days >= 365 ? `${(days / 365).toFixed(1)} years` : `${days.toFixed(0)} days`}</span>.
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Rules of thumb from Kaplan et al. 2020; they ignore attention&apos;s extra cost for long contexts and hardware overheads.</p>
    </Panel>
  );
}
