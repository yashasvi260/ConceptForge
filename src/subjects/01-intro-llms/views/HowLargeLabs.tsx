/** Concept labs for Module 01, step 3 ("How large is large?"). All numbers are exact arithmetic on published configs. */
import { useState } from "react";
import { Panel, Segmented, Slider } from "../../../components/ui";
import { MODEL_CONFIGS, fmt, paramBreakdown, short, type ModelConfig } from "../modelConfigs";
import { ProbBars } from "./labkit";

/* ------------------------------------------------------------------ one neuron */

/** Lab: a single neuron (two weights and a bias) and the parameter count of a whole layer. */
export function NeuronLab() {
  const [w1, setW1] = useState(0.8);
  const [w2, setW2] = useState(-0.5);
  const [b, setB] = useState(0.1);
  const [nIn, setNIn] = useState(768);
  const [nOut, setNOut] = useState(3072);
  const x = [1, 2];
  const y = w1 * x[0]! + w2 * x[1]! + b;
  return (
    <Panel title="Parameters are the numbers training adjusts">
      <p className="text-sm text-slate-300">
        One neuron with inputs <span className="font-mono">x = [1, 2]</span> computes <span className="font-mono">w₁·x₁ + w₂·x₂ + b</span>. Its three parameters are the
        sliders.
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <Slider label="w₁" min={-2} max={2} step={0.1} value={w1} onChange={setW1} format={(v) => v.toFixed(1)} />
        <Slider label="w₂" min={-2} max={2} step={0.1} value={w2} onChange={setW2} format={(v) => v.toFixed(1)} />
        <Slider label="b (bias)" min={-2} max={2} step={0.1} value={b} onChange={setB} format={(v) => v.toFixed(1)} />
      </div>
      <p role="status" className="mt-2 font-mono text-sm text-emerald-300">
        output = {w1.toFixed(1)}·1 + {w2.toFixed(1)}·2 + {b.toFixed(1)} = {y.toFixed(2)}
      </p>
      <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">A whole layer</h4>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <Slider label="Inputs" min={2} max={4096} step={2} value={nIn} onChange={setNIn} format={fmt} />
        <Slider label="Outputs" min={2} max={16384} step={2} value={nOut} onChange={setNOut} format={fmt} />
      </div>
      <p className="mt-2 text-sm text-slate-300">
        Every output neuron has one weight per input plus a bias: <span className="font-mono">{fmt(nIn)} × {fmt(nOut)} + {fmt(nOut)}</span> ={" "}
        <span className="font-mono text-violet-300">{fmt(nIn * nOut + nOut)}</span> parameters.
      </p>
      <p className="mt-1 text-[11px] text-slate-500">768 → 3,072 is GPT-2 small&apos;s feed-forward widening layer: 2,362,368 parameters, in each of its 12 blocks.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ parameter calculator */

/** Lab: count parameters from a configuration, starting from real models' published settings. */
export function ParamCalcLab() {
  const [base, setBase] = useState<ModelConfig>(MODEL_CONFIGS[0]!);
  const [cfg, setCfg] = useState<ModelConfig>(MODEL_CONFIGS[0]!);
  const set = (k: keyof ModelConfig, v: number) => setCfg((c) => ({ ...c, [k]: v }));
  const p = paramBreakdown(cfg);
  const official = paramBreakdown(base).total;
  const edited = JSON.stringify(cfg) !== JSON.stringify(base);
  return (
    <Panel title="Parameter calculator">
      <Segmented
        label="Start from"
        value={base.id}
        options={MODEL_CONFIGS.map((c) => ({ value: c.id, label: c.name }))}
        onChange={(id) => {
          const c = MODEL_CONFIGS.find((m) => m.id === id)!;
          setBase(c);
          setCfg(c);
        }}
      />
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Slider label="Blocks (layers)" min={1} max={128} step={1} value={cfg.layers} onChange={(v) => set("layers", v)} />
        <Slider label="Width d_model" min={128} max={16384} step={128} value={cfg.dModel} onChange={(v) => set("dModel", v)} format={fmt} />
        <Slider label="Feed-forward width" min={256} max={65536} step={256} value={cfg.ffn} onChange={(v) => set("ffn", v)} format={fmt} />
        <Slider label="Vocabulary" min={1000} max={262144} step={1} value={cfg.vocab} onChange={(v) => set("vocab", v)} format={fmt} />
      </div>
      <div className="mt-3">
        <ProbBars
          label="Where the parameters are"
          format={(v) => `${(v * 100).toFixed(1)}%`}
          items={[
            { label: "embeddings", value: p.embedding / p.total },
            { label: "blocks", value: p.layers / p.total },
            { label: "output head", value: p.head / p.total },
          ]}
        />
      </div>
      <p role="status" className="mt-3 text-sm text-slate-200">
        Total: <span className="font-mono text-violet-300">{fmt(p.total)}</span> ({short(p.total)})
        {edited ? ` — ${p.total > official ? "+" : ""}${((p.total / official - 1) * 100).toFixed(1)}% vs ${base.name}` : ` — exactly ${base.name}'s published size`}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">
        {cfg.family === "gpt2" ? "GPT-2 rules: biases, LayerNorm, a position table, tied head." : "Llama rules: no biases, RMSNorm, SwiGLU (3 matrices), grouped-query attention, separate head."}
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ data vs size */

const CHINCHILLA = 20; // tokens per parameter, Hoffmann et al. 2022

/** Lab: training tokens per parameter for real models, against Chinchilla's ~20. */
export function DataVsSizeLab() {
  const models = MODEL_CONFIGS.filter((m) => m.trainingTokens);
  const [params, setParams] = useState(8);
  const [tokens, setTokens] = useState(160);
  const ratio = (tokens * 1e9) / (params * 1e9);
  return (
    <Panel title="Two sizes that aren't parameters: data and context">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Real models</caption>
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="py-1 font-medium">model</th>
            <th className="py-1 font-medium">parameters</th>
            <th className="py-1 font-medium">training tokens</th>
            <th className="py-1 font-medium">tokens per parameter</th>
            <th className="py-1 font-medium">context window</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => {
            const n = paramBreakdown(m).total;
            return (
              <tr key={m.id} className="border-t border-slate-800">
                <td className="py-1 text-slate-100">{m.name}</td>
                <td className="py-1 font-mono text-slate-300">{short(n)}</td>
                <td className="py-1 font-mono text-slate-300">{short(m.trainingTokens!)}</td>
                <td className="py-1 font-mono text-violet-300">{fmt(Math.round(m.trainingTokens! / n))}</td>
                <td className="py-1 font-mono text-slate-300">{fmt(m.context)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Plan your own model</h4>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <Slider label="Parameters (billions)" min={1} max={200} step={1} value={params} onChange={setParams} />
        <Slider label="Training tokens (billions)" min={10} max={20000} step={10} value={tokens} onChange={setTokens} format={fmt} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        {fmt(Math.round(ratio))} tokens per parameter:{" "}
        {ratio < CHINCHILLA * 0.5 ? "under-trained for its size" : ratio < CHINCHILLA * 2 ? "close to compute-optimal" : "trained well past compute-optimal (cheaper to run later)"}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Compute-optimal ≈ {CHINCHILLA} tokens per parameter (Hoffmann et al. 2022, Chinchilla). Model sizes and data from published papers and model cards.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ memory */

const FORMATS = [
  { id: "fp32", bytes: 4 },
  { id: "bf16", bytes: 2 },
  { id: "int8", bytes: 1 },
  { id: "int4", bytes: 0.5 },
] as const;
const GPUS = [8, 12, 16, 24, 48, 80];

/** Lab: weights memory for a real model in each number format, against common GPU sizes. */
export function MemoryLab() {
  const [model, setModel] = useState(MODEL_CONFIGS[1]!.id);
  const [format, setFormat] = useState<(typeof FORMATS)[number]["id"]>("bf16");
  const [gpu, setGpu] = useState(16);
  const n = paramBreakdown(MODEL_CONFIGS.find((m) => m.id === model)!).total;
  const bytes = FORMATS.find((f) => f.id === format)!.bytes;
  const gb = (n * bytes) / 1e9;
  return (
    <Panel title="Will it fit?">
      <div className="space-y-2">
        <Segmented label="Model" value={model} options={MODEL_CONFIGS.map((c) => ({ value: c.id, label: c.name }))} onChange={setModel} />
        <Segmented label="Number format" value={format} options={FORMATS.map((f) => ({ value: f.id, label: f.id }))} onChange={setFormat} />
        <Segmented label="GPU memory" value={String(gpu)} options={GPUS.map((g) => ({ value: String(g), label: `${g} GB` }))} onChange={(v) => setGpu(Number(v))} />
      </div>
      <div className="mt-3">
        <ProbBars label="Weights vs GPU memory" format={(v) => `${(v * 100).toFixed(0)}%`} items={[{ label: `${gb.toFixed(2)} GB`, value: Math.min(1, gb / gpu), highlight: gb <= gpu }]} />
      </div>
      <p role="status" className={`mt-2 text-sm ${gb <= gpu * 0.85 ? "text-emerald-300" : gb <= gpu ? "text-amber-300" : "text-rose-300"}`}>
        {fmt(n)} parameters × {bytes} bytes = {gb.toFixed(2)} GB of weights:{" "}
        {gb <= gpu * 0.85 ? "fits, with room for the prompt's working memory" : gb <= gpu ? "only just fits; little room left for long prompts" : "doesn't fit on this GPU"}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Weights only. Running also needs memory for the KV cache, which grows with prompt length; training needs several times more.</p>
    </Panel>
  );
}
