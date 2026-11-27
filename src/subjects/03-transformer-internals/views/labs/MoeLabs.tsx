/** Concept labs for Module 03, step 9 (Mixture of Experts). Counts come from Mixtral 8x7B's published
 *  configuration; router scores and routing batches are made up (no MoE model runs in the browser). */
import { useState } from "react";
import { Bar, Panel, Segmented, Slider } from "../../../../components/ui";
import { MIXTRAL } from "../../deep/data";

const fmt = (n: number) => n.toLocaleString("en-US");
const bn = (n: number) => `${(n / 1e9).toFixed(1)}B`;

/** Total and active parameters for a Mixtral-shaped model with E experts and k per token. */
export function moeCounts(E: number, k: number): { total: number; active: number } {
  const m = MIXTRAL;
  const d = m.d_model;
  const kv = m.kv_heads * (d / m.heads);
  const shared = 2 * d * d + 2 * d * kv + d * E + 2 * d;
  const expert = 3 * d * m.ffn;
  const outside = d + 2 * m.vocab * d;
  return { total: m.layers * (shared + E * expert) + outside, active: m.layers * (shared + k * expert) + outside };
}

/* ------------------------------------------------------------------ total vs active */

/** Lab: total vs active parameters as the number of experts and experts per token change (computed). */
export function MoeParamsLab() {
  const [E, setE] = useState(8);
  const [k, setK] = useState(2);
  const kk = Math.min(k, E);
  const c = moeCounts(E, kk);
  return (
    <Panel title="Total vs active parameters (Mixtral 8x7B's shape)">
      <div className="grid gap-2 sm:grid-cols-2">
        <Slider label="Experts per block" min={1} max={64} step={1} value={E} onChange={setE} />
        <Slider label="Experts per token" min={1} max={8} step={1} value={kk} onChange={setK} />
      </div>
      <div className="mt-2 space-y-1.5">
        <Bar label="stored (total)" value={c.total} max={c.total} display={bn(c.total)} />
        <Bar label="used per token (active)" value={c.active} max={c.total} display={bn(c.active)} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {E} experts, {kk} per token: {fmt(c.total)} parameters stored, {fmt(c.active)} used per token ({((100 * c.active) / c.total).toFixed(0)}%).
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ the router */

/** Made-up router scores for three tokens over 8 experts. */
const TOKENS: Record<string, number[]> = {
  " loan": [1.2, -0.3, 2.1, 0.4, -1.0, 1.9, 0.0, -0.5],
  " river": [-0.8, 1.7, 0.2, 2.4, 0.1, -0.6, 1.1, 0.3],
  " the": [0.3, 0.2, 0.1, 0.4, 0.2, 0.3, 0.5, 0.1],
};

export function routeTopK(scores: number[], k: number): { top: number[]; weights: number[] } {
  const top = scores.map((s, i) => [s, i] as const).sort((a, b) => b[0] - a[0]).slice(0, k).map(([, i]) => i);
  const m = Math.max(...top.map((i) => scores[i]!));
  const e = top.map((i) => Math.exp(scores[i]! - m));
  const z = e.reduce((a, b) => a + b, 0);
  return { top, weights: e.map((x) => x / z) };
}

/** Lab: one token's router scores, and which experts run with their weights (made-up scores). */
export function MoeRouterLab() {
  const [t, setT] = useState(" loan");
  const [k, setK] = useState<"1" | "2" | "4">("2");
  const s = TOKENS[t]!;
  const r = routeTopK(s, Number(k));
  return (
    <Panel title="Routing one token (made-up router scores)">
      <Segmented label="Token" value={t} options={Object.keys(TOKENS).map((v) => ({ value: v, label: v.trim() }))} onChange={setT} />
      <Segmented label="Experts per token (k)" value={k} options={["1", "2", "4"].map((v) => ({ value: v as typeof k, label: v }))} onChange={setK} />
      <div className="mt-2 space-y-1">
        {s.map((score, e) => {
          const j = r.top.indexOf(e);
          return <Bar key={e} label={`expert ${e} · score ${score.toFixed(1)}`} value={j >= 0 ? r.weights[j]! : 0} max={1} display={j >= 0 ? `runs · weight ${r.weights[j]!.toFixed(3)}` : "skipped"} dim={j < 0} />;
        })}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {JSON.stringify(t)} → experts {r.top.join(" and ")} with weights {r.weights.map((w) => w.toFixed(3)).join(" / ")}; {8 - r.top.length} experts skipped.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ load balancing */

/** Switch Transformer auxiliary loss for a batch where `skew` of the tokens and probability go to expert 0. */
export function switchLoss(skew: number, n = 4): number {
  const rest = (1 - skew) / (n - 1);
  const f = [skew, ...Array(n - 1).fill(rest)] as number[];
  return n * f.reduce((a, fi) => a + fi * fi, 0);
}

/** Lab: skew the routing towards one expert and watch the balancing loss (made-up batch, 4 experts). */
export function MoeBalanceLab() {
  const [skew, setSkew] = useState(0.25);
  const loss = switchLoss(skew);
  const rest = (1 - skew) / 3;
  return (
    <Panel title="Load balancing (made-up routing, 4 experts)">
      <Slider label="Share of tokens sent to expert 0" min={0.25} max={1} step={0.05} value={skew} onChange={setSkew} format={(v) => `${(100 * v).toFixed(0)}%`} />
      <div className="mt-2 space-y-1">
        {[skew, rest, rest, rest].map((f, e) => (
          <Bar key={e} label={`expert ${e}`} value={f} max={1} display={`${(100 * f).toFixed(0)}% of tokens`} />
        ))}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        Balancing loss = 4 × Σ fᵢ·Pᵢ = {loss.toFixed(3)} {skew === 0.25 ? "(perfectly even: the minimum)" : ""}
      </p>
      <p className="mt-1 text-xs text-slate-400">Here the router's average probabilities Pᵢ match the shares fᵢ. Training adds this term to the loss, nudging the router back towards even use.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ memory vs compute */

/** Lab: memory needed for all experts vs a dense model with the same compute per token (16-bit, computed). */
export function MoeMemoryLab() {
  const [gpu, setGpu] = useState(24);
  const c = moeCounts(MIXTRAL.experts, MIXTRAL.experts_per_token);
  const moeGb = (c.total * 2) / 1e9;
  const denseGb = (c.active * 2) / 1e9;
  const fits = (gb: number) => (gb <= gpu ? "fits" : "doesn't fit");
  return (
    <Panel title="MoE saves compute, not memory (16-bit weights)">
      <Slider label="GPU memory (GB)" min={8} max={192} step={8} value={gpu} onChange={setGpu} />
      <div className="mt-2 space-y-1.5">
        <Bar label={`Mixtral 8x7B: ${bn(c.total)} stored`} value={moeGb} max={Math.max(moeGb, gpu)} display={`${moeGb.toFixed(1)} GB · ${fits(moeGb)}`} />
        <Bar label={`dense model, same work per token: ${bn(c.active)}`} value={denseGb} max={Math.max(moeGb, gpu)} display={`${denseGb.toFixed(1)} GB · ${fits(denseGb)}`} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        On {gpu} GB: Mixtral's weights ({moeGb.toFixed(1)} GB) {fits(moeGb)}; a dense model doing the same work per token ({denseGb.toFixed(1)} GB) {fits(denseGb)}.
      </p>
    </Panel>
  );
}
