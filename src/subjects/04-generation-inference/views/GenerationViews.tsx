/** Module 04 short-format views: decoding controls (illustrative logits), the KV cache and the recap. */
import { Dices } from "lucide-react";
import { useState } from "react";
import { Bar, Panel, Slider, Stat, Toggle } from "../../../components/ui";
import { formatBytes, formatCount } from "../../03-transformer-internals/format";
import { kvCost } from "../kvcache";
import { applySampling, type Candidate } from "../sampling";

export const NEXT: Candidate[] = [
  { token: " mat", logit: 4.1 },
  { token: " floor", logit: 3.4 },
  { token: " sofa", logit: 2.5 },
  { token: " windowsill", logit: 2.1 },
  { token: " roof", logit: 1.6 },
  { token: " keyboard", logit: 1.2 },
  { token: " moon", logit: -1.0 },
];

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
          <Bar key={c.token} label={JSON.stringify(c.token)} value={c.finalProb} display={c.kept ? `${(c.finalProb * 100).toFixed(1)}%` : "cut"} dim={!c.kept} color="var(--color-emerald-400)" />
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
        <Bar label="compute OFF" value={off.attentionDots} max={off.attentionDots} display={formatCount(off.attentionDots)} color="var(--color-rose-400)" />
        <Bar label="compute ON" value={onC.attentionDots} max={off.attentionDots} display={formatCount(onC.attentionDots)} color="var(--color-emerald-400)" />
      </div>
    </Panel>
  );
}

export function RecapView() {
  const items = [
    "The last vector × the output matrix → one logit per vocabulary entry",
    "Softmax → next-token probabilities",
    "A decoding rule: greedy, temperature, top-k, top-p",
    "Append the token and run the loop again",
    "KV cache: each token's keys and values computed once and reused",
  ];
  return (
    <Panel title="One generation step">
      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-200">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ol>
    </Panel>
  );
}
