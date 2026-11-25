import { Dices, Layers } from "lucide-react";
import { useState } from "react";
import { Bar, Panel, Segmented, Slider, Stat, Toggle } from "../../../components/ui";
import { formatBytes, formatCount } from "../format";
import { gelu, relu, silu, swiglu } from "../ffn";
import { kvCacheBytes, kvCost } from "../kvcache";
import { layerNorm, rmsNorm } from "../norms";
import { rope, sinusoidal } from "../positional";
import { applySampling, type Candidate } from "../sampling";
import { Curves, signed } from "./viz";

const BOXES = [
  { label: "Token IDs → embeddings", step: "Module 02" },
  { label: "+ position", step: "step 2" },
  { label: "Attention (multi-head, GQA)", step: "steps 3–6" },
  { label: "⊕ residual + norm", step: "step 7" },
  { label: "Feed-forward (SwiGLU)", step: "step 8" },
  { label: "⊕ residual + norm  (× N blocks)", step: "step 7" },
  { label: "Logits → softmax", step: "step 9" },
  { label: "Decode next token (+ KV cache)", step: "steps 10–11" },
];

export function ForwardView() {
  const [active, setActive] = useState(2);
  return (
    <Panel title="One forward pass" icon={<Layers size={14} />}>
      <ol className="mx-auto flex max-w-md flex-col gap-2">
        {BOXES.map((b, i) => (
          <li key={b.label}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-2 text-sm ${i === active ? "border-emerald-500/70 bg-emerald-500/10 text-white" : "border-slate-700 text-slate-300 hover:border-slate-500"}`}
            >
              {b.label}
              <span className="text-xs text-slate-500">{b.step}</span>
            </button>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export function PositionalView() {
  const [pos, setPos] = useState(3);
  const [m, setM] = useState(5);
  const [n, setN] = useState(2);
  const q = [0.9, 0.2, -0.4, 0.7];
  const k = [0.5, -0.8, 0.3, 0.6];
  const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i]!, 0);
  return (
    <>
      <Panel title="Sinusoidal encoding (16 dimensions)">
        <Slider label="Position" value={pos} min={0} max={63} onChange={setPos} />
        <div className="mt-3 space-y-1">
          {[0, 1, 2, 3, pos].map((p, r) => (
            <div key={`${p}-${r}`} className="flex items-center gap-2">
              <span className="w-14 text-right font-mono text-xs text-slate-400">pos {p}</span>
              <span className="flex gap-0.5">
                {sinusoidal(p, 16).map((v, d) => (
                  <span key={d} className="h-5 w-5 rounded-sm" style={{ backgroundColor: signed(v) }} title={v.toFixed(2)} />
                ))}
              </span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="RoPE: rotate q and k by their positions">
        <div className="grid gap-4 sm:grid-cols-2">
          <Slider label="Query position m" value={m} min={0} max={60} onChange={setM} />
          <Slider label="Key position n" value={n} min={0} max={60} onChange={setN} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat label="Distance m − n" value={String(m - n)} />
          <Stat label="score q·k after RoPE" value={dot(rope(q, m), rope(k, n)).toFixed(4)} sub="same for equal distances" />
        </div>
        <p className="mt-2 text-xs text-slate-500">Rotation keeps lengths unchanged; only the angle between q and k (set by m − n) affects the score.</p>
      </Panel>
    </>
  );
}

const GQA_OPTIONS = [
  { value: "32", label: "32 KV heads (MHA)" },
  { value: "8", label: "8 KV heads (GQA)" },
  { value: "1", label: "1 KV head (MQA)" },
];

export function GqaView() {
  const [kv, setKv] = useState("32");
  const [tokens, setTokens] = useState(8192);
  const cfg = { promptTokens: tokens, generatedTokens: 0, layers: 32, kvHeads: Number(kv), headDim: 128, bytesPerValue: 2 };
  const group = 32 / Number(kv);
  return (
    <Panel title="32 query heads sharing K/V heads (example config: 32 layers, head size 128, fp16)">
      <div className="grid gap-4 sm:grid-cols-2">
        <Segmented label="K/V heads" value={kv} options={GQA_OPTIONS} onChange={setKv} />
        <Slider label="Context length" value={tokens} min={512} max={131072} step={512} onChange={setTokens} format={formatCount} />
      </div>
      <div className="mt-4 flex flex-wrap gap-1" aria-label="Query heads coloured by the K/V head they share">
        {Array.from({ length: 32 }, (_, h) => (
          <span key={h} className="h-6 w-6 rounded text-center font-mono text-[10px] leading-6 text-slate-950" style={{ backgroundColor: `hsl(${(Math.floor(h / group) * 47) % 360} 70% 60%)` }}>
            {Math.floor(h / group) + 1}
          </span>
        ))}
      </div>
      <p className="mt-1 text-xs text-slate-500">Each square is a query head; the number is the K/V head it reads (group size {group}).</p>
      <div className="mt-4 grid grid-cols-2 gap-2" data-testid="gqa-memory">
        <Stat label="KV cache for one sequence" value={formatBytes(kvCacheBytes(cfg))} tone={Number(kv) === 32 ? "warn" : "good"} />
        <Stat label="vs multi-head" value={`${group}× smaller`} />
      </div>
    </Panel>
  );
}

export function NormView() {
  const [raw, setRaw] = useState("2, -1, 0.5, 8");
  const x = raw.split(/[,\s]+/).map(Number).filter((v) => Number.isFinite(v)).slice(0, 12);
  const rows = x.length ? [
    { label: "input x", v: x },
    { label: "LayerNorm(x)", v: layerNorm(x) },
    { label: "RMSNorm(x)", v: rmsNorm(x) },
  ] : [];
  return (
    <>
      <Panel title="Residual stream">
        <p className="text-sm text-slate-300">
          <code className="font-mono text-emerald-200">x ← x + Attention(Norm(x))</code>, then{" "}
          <code className="font-mono text-emerald-200">x ← x + FFN(Norm(x))</code>: each sub-layer adds an update to the running vector.
        </p>
      </Panel>
      <Panel title="LayerNorm vs RMSNorm on your vector">
        <label className="block text-sm text-slate-300">
          Vector (comma-separated)
          <input aria-label="Vector" value={raw} onChange={(e) => setRaw(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-sm text-slate-100" />
        </label>
        <table className="mt-3 text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th className="pr-3 text-left font-normal text-slate-400">{r.label}</th>
                {r.v.map((v, i) => (
                  <td key={i} className="px-1.5 text-right font-mono text-slate-100">
                    {v.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!x.length && <p className="text-sm text-slate-500">Type some numbers.</p>}
        <p className="mt-2 text-xs text-slate-500">LayerNorm centres (mean 0) and scales (variance 1). RMSNorm only scales (RMS 1), keeping the sign pattern and ratios.</p>
      </Panel>
    </>
  );
}

export function FfnView() {
  const [g1, setG1] = useState(2);
  const [g2, setG2] = useState(-2);
  const up = [1.5, 1.5];
  const out = swiglu([g1, g2], up);
  return (
    <>
      <Panel title="Activation functions">
        <Curves
          fns={[
            { name: "ReLU", color: "#94a3b8", f: relu },
            { name: "GELU", color: "#34d399", f: gelu },
            { name: "SiLU / Swish", color: "#fbbf24", f: silu },
          ]}
        />
        <div className="mt-2 flex gap-4 text-xs">
          <span className="text-slate-400">— ReLU</span>
          <span className="text-emerald-300">— GELU</span>
          <span className="text-amber-300">— SiLU (Swish₁)</span>
        </div>
      </Panel>
      <Panel title="SwiGLU gating: Swish(gate) × up">
        <div className="grid gap-4 sm:grid-cols-2">
          <Slider label="Gate value (unit 1)" value={g1} min={-4} max={4} step={0.1} onChange={setG1} format={(v) => v.toFixed(1)} />
          <Slider label="Gate value (unit 2)" value={g2} min={-4} max={4} step={0.1} onChange={setG2} format={(v) => v.toFixed(1)} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat label="unit 1 output (up = 1.5)" value={out[0]!.toFixed(3)} />
          <Stat label="unit 2 output (up = 1.5)" value={out[1]!.toFixed(3)} />
        </div>
        <p className="mt-2 text-xs text-slate-500">A negative gate nearly closes the unit; a positive one lets the up-projection through.</p>
      </Panel>
    </>
  );
}

export const NEXT: Candidate[] = [
  { token: " mat", logit: 4.1 },
  { token: " floor", logit: 3.4 },
  { token: " sofa", logit: 2.5 },
  { token: " windowsill", logit: 2.1 },
  { token: " roof", logit: 1.6 },
  { token: " keyboard", logit: 1.2 },
  { token: " moon", logit: -1.0 },
];

export function LogitsView() {
  const probs = applySampling(NEXT, { temperature: 1, topK: 0, topP: 1 });
  return (
    <Panel title="“The cat sat on the …” (illustrative logits)">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="font-normal">Token</th>
            <th className="text-right font-normal">Logit</th>
            <th className="text-right font-normal">Probability</th>
          </tr>
        </thead>
        <tbody>
          {probs.map((c) => (
            <tr key={c.token} className="border-t border-slate-800">
              <td className="py-1 font-mono text-slate-200">{JSON.stringify(c.token)}</td>
              <td className="py-1 text-right font-mono text-slate-400">{c.logit.toFixed(1)}</td>
              <td className="py-1 text-right font-mono text-emerald-200">{(c.prob * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">A real model scores every vocabulary entry (≈200k for GPT-4o); these 7 are illustrative.</p>
    </Panel>
  );
}

export function SamplingView() {
  const [temperature, setTemperature] = useState(1);
  const [topK, setTopK] = useState(0);
  const [topP, setTopP] = useState(1);
  const [samples, setSamples] = useState<string[]>([]);
  const r = applySampling(NEXT, { temperature, topK, topP });
  const draw = () => {
    let x = Math.random();
    for (const c of r) {
      x -= c.finalProb;
      if (x < 0) return c.token;
    }
    return r.find((c) => c.kept)!.token;
  };
  return (
    <Panel title="Decoding controls (illustrative logits)" icon={<Dices size={14} />}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Slider label="Temperature" value={temperature} min={0.1} max={2} step={0.05} onChange={setTemperature} format={(v) => v.toFixed(2)} />
        <Slider label="Top-K" value={topK} min={0} max={7} onChange={setTopK} format={(v) => (v === 0 ? "off" : String(v))} />
        <Slider label="Top-P" value={topP} min={0.05} max={1} step={0.01} onChange={setTopP} format={(v) => v.toFixed(2)} />
      </div>
      <div className="mt-4 space-y-1.5" data-testid="sampling-bars">
        {r.map((c) => (
          <Bar key={c.token} label={JSON.stringify(c.token)} value={c.finalProb} display={c.kept ? `${(c.finalProb * 100).toFixed(1)}%` : "cut"} dim={!c.kept} color="#34d399" />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setSamples((s) => [draw(), ...s].slice(0, 12))} className="rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-medium text-slate-950 hover:bg-emerald-400">
          Sample
        </button>
        {samples.map((t, i) => (
          <span key={i} className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-200">
            {JSON.stringify(t)}
          </span>
        ))}
      </div>
    </Panel>
  );
}

export function KvCacheView() {
  const [on, setOn] = useState(true);
  const [prompt, setPrompt] = useState(1024);
  const [gen, setGen] = useState(512);
  const cfg = { promptTokens: prompt, generatedTokens: gen, layers: 32, kvHeads: 8, headDim: 128, bytesPerValue: 2 };
  const c = kvCost(cfg, on);
  const off = kvCost(cfg, false);
  const onC = kvCost(cfg, true);
  return (
    <Panel title="KV cache ON vs OFF (example: 32 layers, 8 KV heads × 128, fp16)">
      <div className="grid gap-4 sm:grid-cols-3">
        <Toggle label="KV cache" checked={on} onChange={setOn} description="reuse past keys/values" />
        <Slider label="Prompt tokens" value={prompt} min={16} max={16384} step={16} onChange={setPrompt} format={formatCount} />
        <Slider label="Generated tokens" value={gen} min={1} max={4096} onChange={setGen} format={formatCount} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="K/V projections" value={formatCount(c.kvProjections)} tone={on ? "good" : "bad"} />
        <div data-testid="kv-dots">
          <Stat label="Attention dot products" value={formatCount(c.attentionDots)} tone={on ? "good" : "bad"} />
        </div>
        <Stat label="Cache memory" value={formatBytes(c.cacheBytes)} tone={on ? "warn" : "neutral"} />
      </div>
      <div className="mt-4 space-y-2">
        <Bar label="compute OFF" value={off.attentionDots} max={off.attentionDots} display={formatCount(off.attentionDots)} color="#fb7185" />
        <Bar label="compute ON" value={onC.attentionDots} max={off.attentionDots} display={formatCount(onC.attentionDots)} color="#34d399" />
      </div>
    </Panel>
  );
}

export function RecapView() {
  const items = ["Embeddings + position (sinusoidal or RoPE)", "Multi-head attention (causal for decoders; GQA to save memory)", "Residual connections + LayerNorm/RMSNorm", "Feed-forward network (GELU / SwiGLU)", "Logits → softmax → decoding (greedy, temperature, top-k, top-p)", "KV cache for fast generation"];
  return (
    <Panel title="The whole forward pass">
      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-200">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ol>
    </Panel>
  );
}
