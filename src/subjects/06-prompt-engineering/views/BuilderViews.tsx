import { Blocks, Microscope } from "lucide-react";
import { useState } from "react";
import { Panel, Toggle } from "../../../components/ui";
import { GenerationPanel } from "../../../llm/GenerationPanel";
import { findRecording } from "../../../llm/recordings";
import { comboStats } from "../experiment";
import { TICKETS, buildPrompt, comboKey, recordingKey, type Combo } from "../prompts";
import { tokenProbs } from "../probs";
import { extractJson, scoreExtraction } from "../scoring";
import { emptyFile, useExperiment, type ModelChoice } from "../useExperiment";
import { ModelPicker, StatsRow, TicketPicker } from "./shared";

const COMPONENTS: { key: keyof Combo; label: string; description: string }[] = [
  { key: "role", label: "Role", description: "a system prompt saying who the model should be" },
  { key: "fewShot", label: "Few-shot examples", description: "two solved examples" },
  { key: "cot", label: "Chain-of-thought", description: "think step by step first" },
  { key: "schema", label: "JSON schema", description: "constrain the output to a schema" },
];

export function BuilderView({ combo, setCombo, ticketId, setTicketId, model, setModel }: { combo: Combo; setCombo: (c: Combo) => void; ticketId: string; setTicketId: (id: string) => void; model: ModelChoice; setModel: (m: ModelChoice) => void }) {
  const file = useExperiment(model);
  const ticket = TICKETS.find((t) => t.id === ticketId)!;
  const [edited, setEdited] = useState<{ id: string; text: string } | null>(null);
  const text = edited?.id === ticketId ? edited.text : ticket.text;
  const isOriginal = text === ticket.text;
  const p = buildPrompt(combo, text);
  const stats = file ? comboStats(file, combo) : null;
  const rec = file && isOriginal ? findRecording(file, recordingKey(combo, ticketId, 0)) : undefined;
  const samples = file && isOriginal ? [1, 2, 3].map((s) => findRecording(file, recordingKey(combo, ticketId, s))) : [];
  const score = rec ? scoreExtraction(extractJson(rec.output), ticket.gold) : null;

  return (
    <Panel title="Modular prompt builder" icon={<Blocks size={14} />}>
      <div className="mb-3">
        <ModelPicker value={model} onChange={setModel} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {COMPONENTS.map((c) => (
          <Toggle key={c.key} label={c.label} description={c.description} checked={combo[c.key]} onChange={(v) => setCombo({ ...combo, [c.key]: v })} />
        ))}
      </div>
      <p className="mt-2 font-mono text-[11px] text-slate-500">combination {comboKey(combo)} · 8 tickets × 4 samples recorded</p>
      <div className="mt-3">
        <StatsRow s={stats} />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <TicketPicker value={ticketId} onChange={(id) => setTicketId(id)} />
          <label className="block text-sm">
            <span className="text-slate-300">Ticket text (edit to try your own)</span>
            <textarea
              aria-label="Ticket text"
              rows={2}
              value={text}
              onChange={(e) => setEdited({ id: ticketId, text: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
            />
          </label>
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Full prompt</p>
          <pre data-testid="full-prompt" className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-2.5 font-mono text-[11px] text-slate-300">
            {p.system ? `[system] ${p.system}\n\n` : ""}
            {p.prompt}
            {p.format ? `\n\n[format = JSON schema]\n${JSON.stringify(p.format)}` : ""}
          </pre>
        </div>
        <div className="space-y-2">
          <GenerationPanel title="Answer · temperature 0" file={file ?? emptyFile(model)} recording={rec} live={{ request: { model: (file ?? emptyFile(model)).model, ...p, temperature: 0 } }} />
          {score && (
            <p className="text-sm text-slate-300">
              Score: <span className="font-mono">{score.valid ? `${score.fieldsCorrect} / 4 fields` : "invalid JSON"}</span> · correct answer{" "}
              <span className="font-mono text-xs text-slate-400">{JSON.stringify(ticket.gold)}</span>
            </p>
          )}
          {samples.length > 0 && (
            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer">3 more samples at temperature 0.8</summary>
              {samples.map((r, i) => (
                <pre key={i} className="mt-1 whitespace-pre-wrap rounded bg-slate-950 p-2 font-mono text-[11px] text-slate-300">
                  {r?.output ?? "–"}
                </pre>
              ))}
            </details>
          )}
        </div>
      </div>
    </Panel>
  );
}

export function InspectorView({ combo, ticketId, setTicketId, model, setModel }: { combo: Combo; ticketId: string; setTicketId: (id: string) => void; model: ModelChoice; setModel: (m: ModelChoice) => void }) {
  const file = useExperiment(model);
  const rec = file ? findRecording(file, recordingKey(combo, ticketId, 0)) : undefined;
  const toks = rec?.tokens ? tokenProbs(rec.tokens) : [];
  const [sel, setSel] = useState(0);
  const cur = toks[Math.min(sel, toks.length - 1)];
  const shade = (p: number) => (p > 0.9 ? "border-slate-700" : p > 0.5 ? "border-amber-500/60 bg-amber-500/10" : "border-rose-500/60 bg-rose-500/15");
  return (
    <Panel title="Probability inspector (temperature-0 run)" icon={<Microscope size={14} />}>
      <div className="grid gap-3 md:grid-cols-2">
        <ModelPicker value={model} onChange={setModel} />
        <TicketPicker value={ticketId} onChange={setTicketId} />
      </div>
      <p className="mt-2 font-mono text-[11px] text-slate-500">combination {comboKey(combo)} (set on the builder step)</p>
      {!file ? (
        <p className="mt-3 text-sm text-slate-500">Loading the recorded runs…</p>
      ) : (
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="flex max-h-80 flex-wrap gap-0.5 overflow-auto rounded-lg bg-slate-950 p-2 font-mono text-xs">
            {toks.map((t, i) => (
              <button
                key={i}
                type="button"
                data-testid="token-chip"
                onClick={() => setSel(i)}
                title={`${(t.p * 100).toFixed(1)}%`}
                className={`whitespace-pre rounded border px-0.5 text-slate-200 ${shade(t.p)} ${i === sel ? "ring-1 ring-cyan-400" : ""}`}
              >
                {t.token.replace(/\n/g, "↵")}
              </button>
            ))}
          </div>
          <section aria-label="Token alternatives" className="space-y-1 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm">
            {cur ? (
              <>
                <p className="text-xs text-slate-400">
                  Chosen: <span className="font-mono text-slate-100">{JSON.stringify(cur.token)}</span> · {(cur.p * 100).toFixed(1)}%
                </p>
                {cur.alternatives.map((a) => (
                  <div key={a.token} data-testid="alternative" className="flex justify-between gap-2 font-mono text-xs">
                    <span className="text-slate-300">{JSON.stringify(a.token)}</span>
                    <span className="text-slate-400">{(a.p * 100).toFixed(2)}%</span>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-xs text-slate-500">No token probabilities recorded for this run.</p>
            )}
          </section>
        </div>
      )}
      <p className="mt-2 text-xs text-slate-500">
        Real log-probabilities returned by Ollama with the answer (top 5 alternatives per position). Amber and red tokens are where the model hesitated.
      </p>
    </Panel>
  );
}
