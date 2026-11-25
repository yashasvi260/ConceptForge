import { Segmented, Stat } from "../../../components/ui";
import { MODELS, type ModelChoice } from "../useExperiment";
import type { ComboStats } from "../experiment";
import { TICKETS } from "../prompts";

export function TicketPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-300">Ticket</span>
      <select aria-label="Ticket" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200">
        {TICKETS.map((t) => (
          <option key={t.id} value={t.id}>
            {t.text}
          </option>
        ))}
      </select>
    </label>
  );
}

export function StatsRow({ s }: { s: ComboStats | null }) {
  if (!s) return <p className="text-sm text-slate-500">Loading the recorded runs…</p>;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
        <div className="text-[11px] uppercase tracking-wider text-slate-500">Fields right (temp 0)</div>
        <div data-testid="combo-accuracy" className="font-mono text-lg text-slate-100">
          {s.fieldsCorrect} / {s.fieldsTotal}
        </div>
      </div>
      <Stat label="Valid JSON" value={`${s.valid} / ${s.outputs}`} sub="all samples" />
      <Stat label="Answers per ticket" value={s.meanDistinct.toFixed(2)} sub="over 4 samples (1 = always the same)" />
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
        <div className="text-[11px] uppercase tracking-wider text-slate-500">Prompt tokens</div>
        <div data-testid="combo-tokens" className="font-mono text-lg text-slate-100">
          {s.promptTokens ?? "–"}
        </div>
        <div className="text-xs text-slate-500">gemma4's count · avg {Math.round(s.avgMs)} ms</div>
      </div>
    </div>
  );
}


export function ModelPicker({ value, onChange }: { value: ModelChoice; onChange: (m: ModelChoice) => void }) {
  return <Segmented label="Model" value={value} options={(Object.keys(MODELS) as ModelChoice[]).map((m) => ({ value: m, label: MODELS[m].label }))} onChange={onChange} />;
}
