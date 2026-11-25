import { FileText, Link2, Split } from "lucide-react";
import { Panel } from "../../../components/ui";
import { GenerationPanel } from "../../../llm/GenerationPanel";
import { findRecording, type RecordingFile } from "../../../llm/recordings";
import chainRec from "../data/recordings/chain.json";
import { comboStats } from "../experiment";
import { TASK, TICKETS, buildPrompt, recordingKey, type Combo } from "../prompts";
import { useExperiment, type ModelChoice } from "../useExperiment";
import { ModelPicker, StatsRow, TicketPicker } from "./shared";

const CHAIN = chainRec as RecordingFile;
const ALL: Combo = { role: true, fewShot: true, cot: true, schema: true };

export function IntroView() {
  const t = TICKETS[0]!;
  return (
    <Panel title="The task: turn a ticket into data" icon={<FileText size={14} />}>
      <p className="text-sm text-slate-300">“{t.text}”</p>
      <pre className="mt-2 rounded-lg bg-slate-950 p-2.5 font-mono text-xs text-emerald-200">{JSON.stringify(t.gold, null, 2)}</pre>
      <p className="mt-2 text-sm text-slate-400">
        Four fields, {TICKETS.length} test tickets with known answers. Every prompt variant in this module was sent to gemma4:12b for every ticket, four times
        each, and scored automatically.
      </p>
    </Panel>
  );
}

export function AnatomyView() {
  const p = buildPrompt(ALL, TICKETS[0]!.text);
  const parts: [string, string, string][] = [
    ["Role / system", p.system ?? "", "border-violet-500/50"],
    ["Examples (few-shot)", TASK.fewShot.map((e) => `Message: ${e.text}\nJSON: ${JSON.stringify(e.answer)}`).join("\n\n"), "border-sky-500/50"],
    ["Instruction + output format", TASK.instruction, "border-emerald-500/50"],
    ["Reasoning", TASK.cotSchema, "border-amber-500/50"],
    ["Input", `Message: ${TICKETS[0]!.text}`, "border-rose-500/50"],
    ["Structured output (schema)", JSON.stringify(p.format), "border-cyan-500/50"],
  ];
  return (
    <Panel title="Anatomy of a prompt">
      <div className="space-y-2">
        {parts.map(([name, text, border]) => (
          <section key={name} aria-label={name} className={`rounded-lg border-l-4 ${border} bg-slate-950/60 p-2.5`}>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{name}</div>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px] text-slate-300">{text}</pre>
          </section>
        ))}
      </div>
    </Panel>
  );
}

/** Two prompt variants side by side, with their recorded results and one ticket's answers. */
export function CompareView({ a, b, labels, ticketId, setTicketId, model, setModel }: { a: Combo; b: Combo; labels: [string, string]; ticketId: string; setTicketId: (id: string) => void; model: ModelChoice; setModel: (m: ModelChoice) => void }) {
  const file = useExperiment(model);
  return (
    <Panel title={`${labels[0]} vs ${labels[1]}`} icon={<Split size={14} />}>
      <div className="grid gap-3 md:grid-cols-2">
        <ModelPicker value={model} onChange={setModel} />
        <TicketPicker value={ticketId} onChange={setTicketId} />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {[a, b].map((c, i) => {
          const rec = file ? findRecording(file, recordingKey(c, ticketId, 0)) : undefined;
          return (
            <section key={i} aria-label={labels[i]} className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-100">{labels[i]}</h4>
              <StatsRow s={file ? comboStats(file, c) : null} />
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-2.5 font-mono text-[11px] text-slate-300">{rec?.output ?? "…"}</pre>
            </section>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">All numbers come from the recorded runs of the selected model (8 tickets × 4 samples per variant).</p>
    </Panel>
  );
}

export function ChainView({ ticketId, setTicketId }: { ticketId: string; setTicketId: (id: string) => void }) {
  const s1 = findRecording(CHAIN, `chain:${ticketId}:1`);
  const s2 = findRecording(CHAIN, `chain:${ticketId}:2`);
  return (
    <Panel title="Prompt chaining: extract, then reply" icon={<Link2 size={14} />}>
      <TicketPicker value={ticketId} onChange={setTicketId} />
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <section aria-label="Step 1: extract">
          <GenerationPanel title="Step 1 · extract fields" file={CHAIN} recording={s1} />
        </section>
        <section aria-label="Step 2: reply">
          <GenerationPanel title="Step 2 · draft the reply (uses step 1's JSON)" file={CHAIN} recording={s2} />
          {s2 && <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-950 p-2 font-mono text-[10px] text-slate-500">{s2.prompt}</pre>}
        </section>
      </div>
    </Panel>
  );
}

export function RecapView() {
  return (
    <Panel title="What you can now do">
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-300">
        <li>Build a prompt from parts: role, examples, instruction, reasoning, input, output format.</li>
        <li>Measure a prompt change on a test set instead of trusting one good-looking answer.</li>
        <li>Use JSON schemas to make outputs machine-readable, and token probabilities to spot hesitation.</li>
        <li>Split a job into a chain of smaller prompts.</li>
      </ul>
      <p className="mt-3 text-sm text-slate-400">
        Module 07 goes further: models that remember conversations, run in smaller precision, and call tools in a loop (agents).
      </p>
    </Panel>
  );
}
