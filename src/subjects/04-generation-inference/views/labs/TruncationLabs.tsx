/** Concept labs for Module 04, step 3 (the tail, top-k, top-p, min-p and the chain). Real GPT-2 small. */
import { useState } from "react";
import { Bar, Panel, Segmented, Slider } from "../../../../components/ui";
import { GEN, fmt, show } from "../../data/gen";

const short = (p: string) => p.split(" ").slice(0, 3).join(" ") + "…";
const pct = (x: number) => `${(100 * x).toFixed(1)}%`;

/* ------------------------------------------------------------------ the tail */

const TAIL_KS = ["10", "100", "1000", "10000"] as const;

/** Lab: share of the real probability outside the top k, on four prompts. */
export function TailMassLab() {
  const [k, setK] = useState<(typeof TAIL_KS)[number]>("100");
  return (
    <Panel title="Probability outside the top k (GPT-2 small, all 50,257 tokens)">
      <Segmented label="Top k" value={k} options={TAIL_KS.map((v) => ({ value: v, label: fmt(Number(v)) }))} onChange={setK} />
      <div className="mt-3 space-y-1.5">
        {GEN.dists.map((d) => (
          <Bar key={d.prompt} label={short(d.prompt)} value={d.tail[k]!} max={0.7} display={pct(d.tail[k]!)} color="var(--color-rose-400)" />
        ))}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        Outside the top {fmt(Number(k))}: {GEN.dists.map((d) => `${short(d.prompt)} ${pct(d.tail[k]!)}`).join(", ")}.
      </p>
      <p className="mt-1 text-xs text-slate-400">
        To leave less than 5% in the tail you need {GEN.dists.map((d) => fmt(d.nucleus["0.95"]!)).join(", ")} tokens respectively.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ top-k */

const KS = ["1", "5", "10", "40", "100", "1000"] as const;

/** Lab: the share of probability a fixed k keeps on four prompts. */
export function TopKFixedLab() {
  const [k, setK] = useState<(typeof KS)[number]>("40");
  const kept = GEN.dists.map((d) => 1 - d.tail[k]!);
  const lo = Math.min(...kept);
  const hi = Math.max(...kept);
  return (
    <Panel title="Top-k: the same k on four prompts">
      <Segmented label="k" value={k} options={KS.map((v) => ({ value: v, label: fmt(Number(v)) }))} onChange={setK} />
      <div className="mt-3 space-y-1.5">
        {GEN.dists.map((d, i) => (
          <Bar key={d.prompt} label={short(d.prompt)} value={kept[i]!} max={1} display={`keeps ${pct(kept[i]!)}`} color="var(--color-emerald-400)" />
        ))}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        k = {fmt(Number(k))} keeps between {pct(lo)} ({short(GEN.dists[kept.indexOf(lo)]!.prompt)}) and {pct(hi)} ({short(GEN.dists[kept.indexOf(hi)]!.prompt)}) of the probability.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ top-p */

const PS = ["0.5", "0.8", "0.9", "0.95", "0.99"] as const;

/** Lab: the nucleus size for the same p on four prompts. */
export function NucleusLab() {
  const [p, setP] = useState<(typeof PS)[number]>("0.9");
  const sizes = GEN.dists.map((d) => d.nucleus[p]!);
  const maxLog = Math.log10(Math.max(...GEN.dists.map((d) => d.nucleus["0.99"]!)));
  return (
    <Panel title="Top-p: the same p on four prompts">
      <Segmented label="p" value={p} options={PS.map((v) => ({ value: v, label: v }))} onChange={setP} />
      <div className="mt-3 space-y-1.5">
        {GEN.dists.map((d, i) => (
          <Bar key={d.prompt} label={short(d.prompt)} value={Math.log10(sizes[i]!) + 0.1} max={maxLog + 0.1} display={`${fmt(sizes[i]!)} tokens`} color="var(--color-sky-400)" />
        ))}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        p = {p}: the nucleus holds from {fmt(Math.min(...sizes))} to {fmt(Math.max(...sizes))} tokens.
      </p>
      <p className="mt-1 text-xs text-slate-400">Bar length on a log scale. Counted over all {fmt(GEN.config.vocab)} tokens.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ the chain */

export interface ChainResult {
  /** Tokens left after top-k, top-p and min-p. */
  counts: [number, number, number];
  /** Final probability of each input token (0 if cut), in input order. */
  probs: number[];
}

/** Hugging Face's order on a list of logits: temperature → top-k → top-p → min-p, renormalising after each cut. */
export function chain(logits: number[], o: { temperature: number; topK: number; topP: number; minP: number }): ChainResult {
  const z = logits.map((v) => v / o.temperature);
  const order = z.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v).map((x) => x.i);
  let keep = new Set(order.slice(0, o.topK));
  const norm = () => {
    const ids = order.filter((i) => keep.has(i));
    const m = Math.max(...ids.map((i) => z[i]!));
    const e = new Map(ids.map((i) => [i, Math.exp(z[i]! - m)]));
    const s = [...e.values()].reduce((a, b) => a + b, 0);
    return new Map([...e].map(([i, v]) => [i, v / s]));
  };
  const afterK = keep.size;
  let p = norm();
  if (o.topP < 1) {
    let cum = 0;
    const next = new Set<number>();
    for (const i of order) {
      if (!keep.has(i)) continue;
      next.add(i);
      cum += p.get(i)!;
      if (cum >= o.topP - 1e-12) break;
    }
    keep = next;
    p = norm();
  }
  const afterP = keep.size;
  if (o.minP > 0) {
    const top = Math.max(...p.values());
    keep = new Set([...keep].filter((i) => p.get(i)! >= o.minP * top));
    p = norm();
  }
  return { counts: [afterK, afterP, keep.size], probs: logits.map((_, i) => p.get(i) ?? 0) };
}

const PROMPT_OPTIONS = GEN.dists.map((d, i) => ({ value: String(i), label: d.prompt }));

/** Lab: the full chain on GPT-2's real top 40 (top-k at most 40, so every number is exact). */
export function SamplerChainLab() {
  const [pi, setPi] = useState("0");
  const [T, setT] = useState(0.8);
  const [k, setK] = useState(40);
  const [topP, setTopP] = useState(0.9);
  const [minP, setMinP] = useState(0);
  const d = GEN.dists[Number(pi)]!;
  const t = Math.round(T * 10) / 10;
  const r = chain(d.top.map((x) => x.logit), { temperature: t, topK: k, topP, minP });
  const kept = d.top.map((x, i) => ({ ...x, p: r.probs[i]! })).filter((x) => x.p > 0);
  return (
    <Panel title="The sampling chain on GPT-2's real top 40">
      <Segmented label="Prompt" value={pi} options={PROMPT_OPTIONS} onChange={setPi} />
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <Slider label="Temperature" min={0.1} max={2} step={0.1} value={t} onChange={setT} format={(v) => v.toFixed(1)} />
        <Slider label="Top-k" min={1} max={40} step={1} value={k} onChange={setK} />
        <Slider label="Top-p" min={0.05} max={1} step={0.05} value={topP} onChange={setTopP} format={(v) => v.toFixed(2)} />
        <Slider label="Min-p" min={0} max={0.5} step={0.05} value={minP} onChange={setMinP} format={(v) => v.toFixed(2)} />
      </div>
      <div className="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1">
        {kept.map((x) => (
          <Bar key={x.id} label={show(x.token)} value={x.p} max={kept[0]!.p} display={pct(x.p)} color="var(--color-emerald-400)" />
        ))}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        T = {t.toFixed(1)}: top-k keeps {r.counts[0]}, top-p {topP.toFixed(2)} keeps {r.counts[1]}, min-p {minP.toFixed(2)} keeps {r.counts[2]}; {show(kept[0]!.token)} gets {pct(kept[0]!.p)}.
      </p>
      <p className="mt-1 text-xs text-slate-400">Order as in Hugging Face's generate(): temperature → top-k → top-p → min-p, renormalising after each. Top-k is capped at 40 because 40 tokens were recorded.</p>
    </Panel>
  );
}
