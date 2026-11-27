/** Module 04 short-format views (the KV cache and the recap), plus NEXT: illustrative logits used by Module 01's map. */
import { useState } from "react";
import { Bar, Panel, Slider, Stat, Toggle } from "../../../components/ui";
import { formatBytes, formatCount } from "../../03-transformer-internals/format";
import { kvCost } from "../kvcache";
import type { Candidate } from "../sampling";

export const NEXT: Candidate[] = [
  { token: " mat", logit: 4.1 },
  { token: " floor", logit: 3.4 },
  { token: " sofa", logit: 2.5 },
  { token: " windowsill", logit: 2.1 },
  { token: " roof", logit: 1.6 },
  { token: " keyboard", logit: 1.2 },
  { token: " moon", logit: -1.0 },
];

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
