/** Concept labs for Module 03, steps 7–8 (residual connections and normalisation; the feed-forward network). */
import { useState } from "react";
import { Bar, Panel, Segmented, Slider } from "../../../../components/ui";
import { MODEL_CONFIGS, type ModelConfig } from "../../../01-intro-llms/modelConfigs";
import gpt2 from "../../data/gpt2.json";

const fmt = (n: number) => n.toLocaleString("en-US");
const show = (t: string) => JSON.stringify(t);

/* ------------------------------------------------------------------ step 7: residual stream */

const R = gpt2.residual_norms as { tokens: string[]; norms: number[][] };
const STAGE = (k: number) => (k === 0 ? "token + position" : k === 12 ? "block 12 + final norm" : `after block ${k}`);

/** Lab: the length of each token's real GPT-2 vector at every stage of the residual stream. */
export function StreamNormsLab() {
  const [i, setI] = useState(0);
  const col = R.norms.map((row) => row[i]!);
  const max = Math.max(...col);
  return (
    <Panel title="Vector length up the residual stream (real GPT-2 small)">
      <div className="flex flex-wrap gap-1">
        {R.tokens.map((t, k) => (
          <button key={k} type="button" onClick={() => setI(k)} aria-pressed={k === i} aria-label={`Token ${k}: ${t}`} className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${k === i ? "bg-amber-500/30 text-amber-100" : "bg-slate-800 text-slate-300"}`}>
            {t.replace(/ /g, "␣")}
          </button>
        ))}
      </div>
      <div className="mt-2 space-y-1">
        {col.map((v, k) => (
          <Bar key={k} label={STAGE(k)} value={v} max={max} display={v.toFixed(1)} />
        ))}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {show(R.tokens[i]!)}: {col[0]!.toFixed(1)} → {col[11]!.toFixed(1)} after block 11 ({(col[11]! / col[0]!).toFixed(0)}×), then {col[12]!.toFixed(1)} after the final LayerNorm.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 7: depth and signal */

/** Signal left after `layers` layers whose slope is `w`: plain stack w^L; residual stack (1 + 0.1·w)^L... measured
 *  against the plain identity, i.e. each residual layer is x + 0.1·f(x) with f starting small. */
export function depthSignal(w: number, layers: number): { plain: number; residual: number } {
  return { plain: w ** layers, residual: (1 + 0.1 * (w - 1)) ** layers };
}

const sci = (x: number) => (x >= 0.01 && x < 1000 ? x.toFixed(3) : x.toExponential(2));

/** Lab: a toy model of how a learning signal survives many layers, with and without the residual path. */
export function ResidualDepthLab() {
  const [w, setW] = useState(0.7);
  const [L, setL] = useState(24);
  const s = depthSignal(w, L);
  return (
    <Panel title="How much signal survives the stack? (toy)">
      <div className="grid gap-2 sm:grid-cols-2">
        <Slider label="Each layer's slope" min={0.5} max={1.5} step={0.05} value={w} onChange={setW} format={(v) => v.toFixed(2)} />
        <Slider label="Layers" min={1} max={96} step={1} value={L} onChange={setL} />
      </div>
      <div className="mt-2 space-y-1.5">
        <Bar label="without residuals" value={Math.min(1, s.plain)} max={1} display={sci(s.plain)} />
        <Bar label="with residuals" value={Math.min(1, s.residual)} max={1} display={sci(s.residual)} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {L} layers, slope {w.toFixed(2)}: without residuals the signal is {sci(s.plain)} of where it started; with residuals {sci(s.residual)}.
      </p>
      <p className="mt-1 text-xs text-slate-400">Toy: a plain layer multiplies the signal by its slope; a residual layer x + 0.1·f(x) multiplies it by 1 + 0.1·(slope − 1), so the identity path keeps it near 1.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 7: pre-norm vs post-norm */

const LN = gpt2.layernorm;

/** Lab: the two orders of normalisation and residual, side by side, with GPT-2's real LayerNorm statistics. */
export function PrePostLab() {
  const [order, setOrder] = useState<"pre" | "post">("pre");
  const steps =
    order === "pre"
      ? ["x = x + Attention(Norm(x))", "x = x + FFN(Norm(x))", "… × 12 blocks …", "output = Norm(x)   ← one final norm"]
      : ["x = Norm(x + Attention(x))", "x = Norm(x + FFN(x))", "… × 12 blocks …", "output = x"];
  return (
    <Panel title="Where does the norm go?">
      <Segmented
        label="Order"
        value={order}
        options={[
          { value: "pre", label: "pre-norm (GPT-2, Llama)" },
          { value: "post", label: "post-norm (original Transformer)" },
        ]}
        onChange={setOrder}
      />
      <ol className="mt-2 space-y-1 font-mono text-sm text-emerald-200">
        {steps.map((s) => (
          <li key={s} className="rounded border border-slate-800 px-2 py-1">
            {s}
          </li>
        ))}
      </ol>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {order === "pre"
          ? "Pre-norm: each sub-layer sees a normalised copy; the stream itself is never normalised until the final norm."
          : "Post-norm: the stream itself is normalised after every sub-layer, so the identity path is rescaled at each step."}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        GPT-2's first LayerNorm on a real vector ({show(LN.token)}): standard deviation {LN.before.std} → {LN.normalised.std} after normalising → {LN.after_gain_bias.std} after its learned gain.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 8: widen and narrow */

const BY_ID = Object.fromEntries(MODEL_CONFIGS.map((c) => [c.id, c])) as Record<string, ModelConfig>;
const MODEL_OPTIONS = [
  { value: "gpt2-small", label: "GPT-2 small" },
  { value: "llama3-8b", label: "Llama 3 8B" },
  { value: "gpt3-175b", label: "GPT-3 175B" },
];

/** Lab: one token through a real model's feed-forward network: widths and parameters (published configs). */
export function FfnShapesLab() {
  const [id, setId] = useState("gpt2-small");
  const c = BY_ID[id]!;
  const mats = c.family === "gpt2" ? 2 : 3;
  const params = mats * c.dModel * c.ffn;
  return (
    <Panel title="Widen, bend, narrow">
      <Segmented label="Model" value={id} options={MODEL_OPTIONS} onChange={setId} />
      <div className="mt-2 space-y-1.5">
        <Bar label="in: d_model" value={c.dModel} max={c.ffn} display={fmt(c.dModel)} />
        <Bar label={c.family === "gpt2" ? "hidden (GELU)" : "hidden (SwiGLU)"} value={c.ffn} max={c.ffn} display={fmt(c.ffn)} />
        <Bar label="out: d_model" value={c.dModel} max={c.ffn} display={fmt(c.dModel)} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {c.name}: {fmt(c.dModel)} → {fmt(c.ffn)} ({(c.ffn / c.dModel).toFixed(2)}×) → {fmt(c.dModel)}, {mats} matrices, {fmt(params)} weights per block.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 8: active units */

const F = gpt2.ffn as { active_share: number[]; negative_share: number[] };

/** Lab: what share of GPT-2's real hidden units are clearly active, block by block. */
export function FfnActiveLab() {
  const lo = Math.min(...F.active_share);
  const hi = Math.max(...F.active_share);
  return (
    <Panel title="How many of GPT-2's 3,072 hidden units fire? (real)">
      <div className="space-y-1">
        {F.active_share.map((a, l) => (
          <Bar key={l} label={`block ${l + 1}`} value={a} max={0.2} display={`${(100 * a).toFixed(1)}% active · ${(100 * F.negative_share[l]!).toFixed(0)}% negative`} />
        ))}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        In every block, only {(100 * lo).toFixed(1)}%–{(100 * hi).toFixed(1)}% of the values after GELU are above 0.1.
      </p>
      <p className="mt-1 text-xs text-slate-400">Values for all 12 tokens of “The bank approved the loan because the customer had a steady income”.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 8: SwiGLU width */

const DL = 4096;

/** Lab: SwiGLU's three matrices against a 4×-wide GELU network, as the hidden width changes (d = 4,096). */
export function SwigluParamsLab() {
  const [f, setF] = useState(14336);
  const sw = 3 * DL * f;
  const ge = 2 * DL * 4 * DL;
  return (
    <Panel title="SwiGLU's width (d_model = 4,096)">
      <Slider label="SwiGLU hidden width" min={8192} max={20480} step={1} value={f} onChange={setF} format={fmt} />
      <div className="mt-2 space-y-1.5">
        <Bar label="SwiGLU (3 matrices)" value={sw} max={Math.max(sw, ge)} display={fmt(sw)} />
        <Bar label="GELU, 4× wide (2 matrices)" value={ge} max={Math.max(sw, ge)} display={fmt(ge)} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        f = {fmt(f)}: SwiGLU {fmt(sw)} vs 4× GELU {fmt(ge)} ({(sw / ge).toFixed(4)}×). Equal at f = 8 × 4,096 / 3 ≈ 10,923.
      </p>
      <p className="mt-1 text-xs text-slate-400">Llama 3 8B uses f = 14,336.</p>
    </Panel>
  );
}
