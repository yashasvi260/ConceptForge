/** Concept labs for Module 04, step 5 (the KV cache). Real GPT-2 small recordings plus published configurations. */
import { useState } from "react";
import { Bar, Panel, Segmented, Slider, Stat } from "../../../../components/ui";
import { MODEL_CONFIGS, paramBreakdown } from "../../../01-intro-llms/modelConfigs";
import { GEN, fmt, show } from "../../data/gen";

const KV = GEN.kv;
const [, HEADS, , DH] = KV.layer_shape as [number, number, number, number];
const gb = (b: number) => `${(b / 1e9).toFixed(2)} GB`;
const mb = (b: number) => `${(b / 1e6).toFixed(2)} MB`;

/* ------------------------------------------------------------------ inside the cache */

/** Lab: GPT-2's per-layer key and value tensors as the cache grows (shape recorded from the real loop). */
export function KvShapesLab() {
  const [t, setT] = useState(KV.layer_shape[2]!);
  const perLayer = HEADS * t * DH;
  const numbers = 2 * KV.layers * perLayer;
  const perToken = 2 * KV.layers * HEADS * DH * KV.bytes_per_number;
  return (
    <Panel title="Inside GPT-2's KV cache (past_key_values)">
      <Slider label="Tokens in the cache" min={1} max={GEN.config.n_positions} step={1} value={t} onChange={setT} format={fmt} />
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="keys, per layer" value={`(1, ${HEADS}, ${fmt(t)}, ${DH})`} />
        <Stat label="values, per layer" value={`(1, ${HEADS}, ${fmt(t)}, ${DH})`} />
        <Stat label="numbers, all layers" value={fmt(numbers)} />
        <Stat label="32-bit memory" value={mb(numbers * KV.bytes_per_number)} tone="warn" />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {fmt(t)} token{t === 1 ? "" : "s"}: {KV.layers} layers × keys and values of shape (1, {HEADS}, {fmt(t)}, {DH}) = {fmt(numbers)} numbers; each token adds {fmt(perToken)} bytes.
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Shape recorded from GPT-2's real cache after the 20-step loop: ({KV.layer_shape.join(", ")}) in each of {KV.layers} layers. GPT-2 stops at {fmt(GEN.config.n_positions)} tokens.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ same answer, less work */

/** Lab: the real loop with and without the cache, step by step, plus measured step times. */
export function KvEqualLab() {
  const [n, setN] = useState(20);
  const a = KV.steps_cache[n - 1]!;
  const b = KV.steps_nocache[n - 1]!;
  const fedA = KV.steps_cache.slice(0, n).reduce((s, x) => s + x.fed, 0);
  const fedB = KV.steps_nocache.slice(0, n).reduce((s, x) => s + x.fed, 0);
  const t = KV.timing;
  return (
    <Panel title={`Cache on and off, "${KV.prompt}" (GPT-2 small, real)`}>
      <Slider label="Step" min={1} max={KV.steps_cache.length} step={1} value={n} onChange={setN} />
      <table className="mt-2 w-full text-left text-sm">
        <caption className="sr-only">Both loops at this step</caption>
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="font-normal" />
            <th className="font-normal">with the cache</th>
            <th className="font-normal">without</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["token chosen", show(a.token), show(b.token)],
            ["tokens fed this step", String(a.fed), String(b.fed)],
            [`tokens fed in ${n} step${n === 1 ? "" : "s"}`, fmt(fedA), fmt(fedB)],
          ].map(([k, x, y]) => (
            <tr key={k} className="border-t border-slate-800">
              <td className="py-1 text-slate-400">{k}</td>
              <td className="py-1 font-mono text-emerald-200">{x}</td>
              <td className="py-1 font-mono text-rose-200">{y}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 space-y-1.5">
        <Bar label="step, cache" value={t.decode_ms_median_cache} max={t.decode_ms_median_nocache} display={`${t.decode_ms_median_cache} ms`} color="var(--color-emerald-400)" />
        <Bar label="step, no cache" value={t.decode_ms_median_nocache} max={t.decode_ms_median_nocache} display={`${t.decode_ms_median_nocache} ms`} color="var(--color-rose-400)" />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        Step {n}: both loops chose {show(a.token)}; fed {fmt(fedA)} vs {fmt(fedB)} tokens so far. All {KV.steps_cache.length} tokens identical: {KV.same_tokens ? "yes" : "no"}; largest logit difference {KV.max_logit_diff}.
      </p>
      <p className="mt-1 text-xs text-slate-400">Step times: median decode step at {t.prompt_tokens} tokens of context on a CPU with {t.cpu_threads} threads.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ the memory bill */

const MODEL_OPTIONS = MODEL_CONFIGS.map((m) => ({ value: m.id, label: m.name }));

export const kvPerToken = (m: (typeof MODEL_CONFIGS)[number], bytes = 2) => 2 * m.layers * m.kvHeads * (m.dModel / m.heads) * bytes;

/** Lab: one conversation's 16-bit cache against the model's 16-bit weights, for published configs. */
export function KvMemoryLab() {
  const [id, setId] = useState("llama3-8b");
  const [exp, setExp] = useState(13);
  const m = MODEL_CONFIGS.find((x) => x.id === id)!;
  const tokens = 2 ** exp;
  const cache = kvPerToken(m) * tokens;
  const weights = paramBreakdown(m).total * 2;
  const at4 = Math.ceil(4e9 / kvPerToken(m));
  return (
    <Panel title="One conversation's KV cache (16-bit)">
      <Segmented label="Model" value={id} options={MODEL_OPTIONS} onChange={setId} />
      <div className="mt-2">
        <Slider label="Context length" min={10} max={17} step={1} value={exp} onChange={setExp} format={(v) => fmt(2 ** v)} />
      </div>
      <div className="mt-3 space-y-1.5">
        <Bar label="weights" value={weights} max={Math.max(weights, cache)} display={gb(weights)} color="var(--color-sky-400)" />
        <Bar label="KV cache" value={cache} max={Math.max(weights, cache)} display={gb(cache)} color="var(--color-amber-400)" />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {m.name} at {fmt(tokens)} tokens: {gb(cache)} of cache next to {gb(weights)} of weights ({fmt(kvPerToken(m))} bytes per token); one conversation passes 4 GB at {fmt(at4)} tokens.
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Trained context: {fmt(m.context)} tokens{tokens > m.context ? " — this length is beyond it (step 6)" : ""}. Every conversation a server holds needs its own cache.
      </p>
    </Panel>
  );
}
