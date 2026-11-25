import { MessageSquareText } from "lucide-react";
import { Bar, Panel } from "../../../components/ui";
import { GenerationPanel } from "../../../llm/GenerationPanel";
import { predictProba } from "../classifier";
import { CLASSIFY_RECORDINGS, GEN_MODEL, LABEL_IDS, TEST_TICKETS, defaultHead, generativeVerdict, promptFor, recordingFor, ticketVector } from "../model";
import { zeroShot } from "../zeroShot";
import { TicketSelect, useLabelVectors, type Descriptions } from "./ZeroShotView";

const pct = (p: number) => `${(p * 100).toFixed(p > 0.999 ? 2 : 1)}%`;

export function GenerativeView({ ticketId, setTicketId }: { ticketId: string; setTicketId: (id: string) => void }) {
  const ticket = TEST_TICKETS.find((t) => t.id === ticketId)!;
  const rec = recordingFor(ticket.id);
  const v = rec ? generativeVerdict(rec) : null;
  return (
    <Panel title="Generative classification by prompting" icon={<MessageSquareText size={14} />}>
      <TicketSelect value={ticketId} onChange={setTicketId} />
      <p className="mt-3 text-[11px] uppercase tracking-wider text-slate-500">Prompt sent to {GEN_MODEL}</p>
      <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-950 p-2.5 font-mono text-xs text-slate-300">{promptFor(ticket.text)}</pre>
      <div className="mt-3">
        <GenerationPanel
          title="gemma4's answer"
          file={CLASSIFY_RECORDINGS}
          recording={rec}
          live={{ request: { model: GEN_MODEL, prompt: promptFor(ticket.text), temperature: 0, logprobs: true } }}
        />
      </div>
      {v && v.p !== null && (
        <div className="mt-3 space-y-1">
          <p data-testid="gen-confidence" className="text-sm text-slate-300">
            Probability of its first token: <span className="font-mono text-slate-100">{pct(v.p)}</span>
          </p>
          {v.alternatives.slice(0, 4).map((a) => (
            <Bar key={a.token} label={JSON.stringify(a.token)} value={a.p} max={1} display={pct(a.p)} color="var(--color-sky-400)" />
          ))}
          <p className="text-xs text-slate-500">These are the model's real log-probabilities, recorded with the answer.</p>
        </div>
      )}
    </Panel>
  );
}

export function ConfidenceView({ ticketId, setTicketId, descriptions }: { ticketId: string; setTicketId: (id: string) => void; descriptions: Descriptions }) {
  const ticket = TEST_TICKETS.find((t) => t.id === ticketId)!;
  const head = predictProba(defaultHead(), ticketVector(ticket.id));
  const { labelVecs } = useLabelVectors(descriptions);
  const zs = labelVecs ? zeroShot(ticketVector(ticket.id), labelVecs).probs : null;
  const rec = recordingFor(ticket.id);
  const gen = rec ? generativeVerdict(rec) : null;
  const col = (title: string, probs: number[] | null, note: string) => (
    <section aria-label={title} className="space-y-1 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
      <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
      {probs ? LABEL_IDS.map((l, i) => <Bar key={l} label={l} value={probs[i]!} max={1} display={pct(probs[i]!)} color="var(--color-violet-400)" />) : <p className="text-xs text-slate-500">…</p>}
      <p className="text-xs text-slate-500">{note}</p>
    </section>
  );
  const genProbs = gen ? LABEL_IDS.map((l) => gen.alternatives.find((a) => a.token.trim().toLowerCase() === l)?.p ?? 0) : null;
  return (
    <Panel title="What “confidence” means for each method">
      <TicketSelect value={ticketId} onChange={setTicketId} />
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {col("Head", head, "Softmax output of the trained head.")}
        {col("Zero-shot", zs, "softmax(cosine / 0.05): depends on a display temperature.")}
        {col("gemma4", genProbs, "First-token probability of each label word (only the model's top 5 alternatives were recorded; others show 0).")}
      </div>
      <p className="mt-3 text-sm text-slate-400">
        A high number is not proof. A model can be confidently wrong; whether 90% really means “right 9 times in 10” (calibration) has to be measured on
        held-out data.
      </p>
    </Panel>
  );
}
