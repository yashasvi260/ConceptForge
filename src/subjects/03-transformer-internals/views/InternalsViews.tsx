import { Layers } from "lucide-react";
import { useState } from "react";
import { Panel, Segmented, Slider, Stat } from "../../../components/ui";
import { formatBytes, formatCount } from "../format";
import { gelu, relu, silu, swiglu } from "../ffn";
import { kvCacheBytes } from "../../04-generation-inference/kvcache";
import { layerNorm, rmsNorm } from "../norms";
import { rope, sinusoidal } from "../positional";
import { Curves, signed } from "./viz";

const BOXES = [
  { label: "Token IDs → embeddings", step: "Module 02" },
  { label: "+ position", step: "step 2" },
  { label: "Norm → attention (multi-head, GQA) ⊕ residual", step: "steps 3–7" },
  { label: "Norm → feed-forward (SwiGLU or experts) ⊕ residual", step: "steps 7–9" },
  { label: "× N blocks, then a final norm", step: "step 7" },
  { label: "Last vector → logits → next token", step: "Module 04" },
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
            { name: "ReLU", color: "var(--color-slate-400)", f: relu },
            { name: "GELU", color: "var(--color-emerald-400)", f: gelu },
            { name: "SiLU / Swish", color: "var(--color-amber-400)", f: silu },
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


export function RecapView() {
  const items = ["Embeddings + position (sinusoidal or RoPE)", "Multi-head attention (causal for decoders; GQA to save memory)", "Residual connections + LayerNorm/RMSNorm", "Feed-forward network (GELU / SwiGLU)", "The final vector, ready to become next-token scores (Module 04)"];
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
