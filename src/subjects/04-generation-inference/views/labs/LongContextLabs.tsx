/** Concept labs for Module 04, step 6 (long context). Real GPT-2 loss by context; costs computed from published configs. */
import { useState } from "react";
import { Bar, Panel, Segmented, Slider, Toggle } from "../../../../components/ui";
import { MODEL_CONFIGS, paramBreakdown } from "../../../01-intro-llms/modelConfigs";
import { GEN, fmt } from "../../data/gen";
import { kvPerToken } from "./KvCacheLabs";

const MODEL_OPTIONS = MODEL_CONFIGS.map((m) => ({ value: m.id, label: m.name }));
const pct = (x: number) => `${(100 * x).toFixed(1)}%`;

/** Kaplan et al.'s attention share of forward FLOPs per token: L·n·d / (N + L·n·d), N = non-embedding parameters. */
export function attentionShare(m: (typeof MODEL_CONFIGS)[number], context: number): number {
  const N = paramBreakdown(m).layers;
  const a = m.layers * context * m.dModel;
  return a / (N + a);
}

export const crossover = (m: (typeof MODEL_CONFIGS)[number]) => Math.round(paramBreakdown(m).layers / (m.layers * m.dModel));

/* ------------------------------------------------------------------ attention's share */

/** Lab: attention's share of the work per token as the context grows (computed from published configs). */
export function CtxCostLab() {
  const [id, setId] = useState("llama3-8b");
  const [exp, setExp] = useState(13);
  const m = MODEL_CONFIGS.find((x) => x.id === id)!;
  const n = 2 ** exp;
  const share = attentionShare(m, n);
  const x = crossover(m);
  return (
    <Panel title="How much of the work is attention? (Kaplan et al.'s estimate)">
      <Segmented label="Model" value={id} options={MODEL_OPTIONS} onChange={setId} />
      <div className="mt-2">
        <Slider label="Context length" min={9} max={18} step={1} value={exp} onChange={setExp} format={(v) => fmt(2 ** v)} />
      </div>
      <div className="mt-3 space-y-1.5">
        <Bar label="attention" value={share} max={1} display={pct(share)} color="var(--color-rose-400)" />
        <Bar label="everything else" value={1 - share} max={1} display={pct(1 - share)} color="var(--color-sky-400)" />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {m.name} at {fmt(n)} tokens: attention is {pct(share)} of the work per token; it equals the rest at {fmt(x)} tokens ({(x / m.context).toFixed(1)}× its trained context of {fmt(m.context)}).
      </p>
      <p className="mt-1 text-xs text-slate-400">FLOPs per token ≈ 2N + 2·L·n·d, N = non-embedding parameters ({fmt(paramBreakdown(m).layers)}).</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ context helps */

const LC = GEN.long_context;
const bucketLabel = (b: { from: number; to: number }) => (b.from === b.to ? String(b.from) : `${b.from}–${fmt(b.to)}`);

/** Lab: GPT-2's real loss grouped by how much context each prediction had. */
export function LossByContextLab() {
  const [k, setK] = useState(String(LC.by_context.length - 1));
  const b = LC.by_context[Number(k)]!;
  const max = Math.max(...LC.by_context.map((x) => x.loss));
  return (
    <Panel title={`GPT-2's loss by context (${LC.text}, real)`}>
      <Segmented label="Tokens of context" value={k} options={LC.by_context.map((x, i) => ({ value: String(i), label: bucketLabel(x) }))} onChange={setK} />
      <div className="mt-3 space-y-1.5">
        {LC.by_context.map((x, i) => (
          <Bar key={i} label={bucketLabel(x)} value={x.loss} max={max} display={x.loss.toFixed(3)} dim={String(i) !== k} color="var(--color-amber-400)" />
        ))}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        With {bucketLabel(b)} tokens of context: average loss {b.loss} over {fmt(b.count)} predictions, perplexity {Math.exp(b.loss).toFixed(1)}.
      </p>
      <p className="mt-1 text-xs text-slate-400">{LC.windows} windows of {fmt(LC.n_positions)} tokens. The 1-token row has only {LC.by_context[0]!.count} predictions.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ positions beyond training */

const TRAIN = 8192;
const BASE = 500_000;
const D_HEAD = 128;
const TARGETS = ["8192", "16384", "32768", "131072"] as const;
export const ropeAngle = (pos: number, pair: number) => pos * BASE ** ((-2 * pair) / D_HEAD);

/** Lab: one RoPE pair's angle at the end of a long input, against the largest angle seen in training (Llama 3 shape). */
export function PositionLimitLab() {
  const [target, setTarget] = useState<(typeof TARGETS)[number]>("32768");
  const [pair, setPair] = useState(48);
  const [interp, setInterp] = useState(false);
  const L = Number(target);
  const pos = (L - 1) * (interp ? TRAIN / L : 1);
  const a = ropeAngle(pos, pair);
  const trained = ropeAngle(TRAIN, pair); // the edge of the trained range [0, 8,192)
  const circles = trained >= 2 * Math.PI;
  const inside = circles || a < trained;
  return (
    <Panel title="RoPE past the trained length (Llama 3: head width 128, base 500,000, trained on 8,192)">
      <div className="grid gap-3 sm:grid-cols-2">
        <Segmented label="Input length" value={target} options={TARGETS.map((v) => ({ value: v, label: fmt(Number(v)) }))} onChange={setTarget} />
        <Slider label="Dimension pair" min={0} max={D_HEAD / 2 - 1} step={1} value={pair} onChange={setPair} />
      </div>
      <div className="mt-2">
        <Toggle label="Position interpolation" checked={interp} onChange={setInterp} description={`multiply positions by ${fmt(TRAIN)} / ${fmt(L)}`} />
      </div>
      <div className="mt-3 space-y-1.5">
        <Bar label="trained range" value={trained} max={Math.max(a, trained)} display={`${trained.toFixed(2)} rad`} color="var(--color-sky-400)" />
        <Bar label="last position" value={a} max={Math.max(a, trained)} display={`${a.toFixed(2)} rad`} color={inside ? "var(--color-emerald-400)" : "var(--color-rose-400)"} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        Pair {pair}, position {fmt(L - 1)}{interp ? ` (read as ${fmt(Math.round(pos * 100) / 100)})` : ""}: {a.toFixed(3)} rad; training covered angles up to {trained.toFixed(3)} rad. {circles ? "This pair already turned full circles in training, so every angle is familiar." : inside ? "Inside the trained range." : "Outside the trained range: the model has never seen this rotation."}
      </p>
      <p className="mt-1 text-xs text-slate-400">GPT-2 has no such option: its learned table has {fmt(GEN.config.n_positions)} rows, and token {fmt(GEN.config.n_positions + 1)} raised a real {LC.over_limit_error}.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ sliding window */

/** Query-key products for n tokens with a causal sliding window w (w ≥ n is full causal attention). */
export const windowProducts = (n: number, w: number) => Array.from({ length: n }, (_, i) => Math.min(i + 1, w)).reduce((a, b) => a + b, 0);

const MISTRAL = MODEL_CONFIGS.find((m) => m.id === "llama3-8b")!;

/** Lab: a causal sliding-window mask, its work, and its cache next to full attention. */
export function SlidingWindowLab() {
  const [n, setN] = useState(16);
  const [w, setW] = useState(4);
  const win = Math.min(w, n);
  const full = windowProducts(n, n);
  const slid = windowProducts(n, win);
  const per = kvPerToken(MISTRAL);
  return (
    <Panel title="Sliding-window attention">
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="Tokens" min={4} max={24} step={1} value={n} onChange={setN} />
        <Slider label="Window" min={1} max={24} step={1} value={w} onChange={setW} />
      </div>
      <div className="mt-3 inline-grid gap-px" style={{ gridTemplateColumns: `repeat(${n}, 0.7rem)` }} aria-hidden>
        {Array.from({ length: n * n }, (_, k) => {
          const i = Math.floor(k / n);
          const j = k % n;
          const on = j <= i && i - j < win;
          const causal = j <= i;
          return <span key={k} className="h-[0.7rem]" style={{ backgroundColor: on ? "rgba(52,211,153,0.85)" : causal ? "rgba(148,163,184,0.25)" : "transparent" }} />;
        })}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {n} tokens, window {win}: {fmt(slid)} of {fmt(full)} query-key products; the cache keeps the last {win} token{win === 1 ? "" : "s"} instead of {n}.
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Green: attended; grey: what full causal attention would add. Mistral 7B has Llama 3 8B's cache shape ({fmt(per)} bytes per token) and a window of 4,096: at 32,768 tokens its cache is {(per * 4096 / 1e9).toFixed(2)} GB instead of {(per * 32768 / 1e9).toFixed(2)} GB.
      </p>
    </Panel>
  );
}
