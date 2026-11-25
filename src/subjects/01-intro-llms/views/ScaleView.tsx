import { Scale } from "lucide-react";
import { useState } from "react";
import { Bar, Panel, Segmented, Stat } from "../../../components/ui";
import { MODEL_CONFIGS, fmt, paramBreakdown, short } from "../modelConfigs";

export function ScaleView() {
  const [id, setId] = useState(MODEL_CONFIGS[0]!.id);
  const c = MODEL_CONFIGS.find((m) => m.id === id)!;
  const b = paramBreakdown(c);
  const rows: [string, string][] = [
    ["Layers (transformer blocks)", fmt(c.layers)],
    ["Hidden size (numbers per vector)", fmt(c.dModel)],
    ["Attention heads", c.kvHeads === c.heads ? fmt(c.heads) : `${fmt(c.heads)} query / ${fmt(c.kvHeads)} key-value`],
    ["Feed-forward width", fmt(c.ffn)],
    ["Vocabulary", `${fmt(c.vocab)} tokens`],
    ["Context window", `${fmt(c.context)} tokens`],
    ["Training data", c.trainingTokens ? `${short(c.trainingTokens)} tokens` : "not published as a token count"],
  ];
  return (
    <Panel title="What “large” means" icon={<Scale size={14} />}>
      <Segmented
        label="Model"
        value={id}
        options={MODEL_CONFIGS.map((m) => ({ value: m.id, label: `${m.name} (${m.year})` }))}
        onChange={setId}
      />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <table aria-label="Configuration" className="w-full text-sm">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-b border-slate-800">
                <td className="py-1.5 pr-3 text-slate-400">{k}</td>
                <td className="py-1.5 text-right font-mono text-slate-100">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="space-y-3">
          <Stat label="Parameters (computed from the config)" value={fmt(b.total)} sub={`≈ ${short(b.total)} · ${(b.total * 2 / 1e9).toFixed(1)} GB in 16-bit numbers`} />
          <div className="space-y-1.5">
            <Bar label="embedding table" value={b.embedding} max={b.total} display={`${((b.embedding / b.total) * 100).toFixed(1)}%`} color="var(--color-violet-400)" />
            <Bar label="transformer layers" value={b.layers} max={b.total} display={`${((b.layers / b.total) * 100).toFixed(1)}%`} color="var(--color-emerald-400)" />
            <Bar label="output head" value={b.head} max={b.total} display={b.head === 0 ? "shared" : `${((b.head / b.total) * 100).toFixed(1)}%`} color="var(--color-amber-400)" />
          </div>
          <p className="text-xs text-slate-500">
            Source:{" "}
            <a href={c.source} className="underline" target="_blank" rel="noreferrer">
              {c.source.replace("https://", "")}
            </a>
          </p>
        </div>
      </div>
    </Panel>
  );
}
