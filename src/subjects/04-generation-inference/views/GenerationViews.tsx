/** Module 04's KV cache on/off view (counted for Llama 3 8B's shape), plus NEXT: illustrative logits used by Module 01's map. */
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
    <Panel title="KV cache on vs off (Llama 3 8B's shape: 32 layers, 8 KV heads × 128, 16-bit)">
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
