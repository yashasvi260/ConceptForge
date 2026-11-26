import { Sparkles } from "lucide-react";
import { useMemo } from "react";
import { Panel } from "../../../components/ui";
import { ModelRunError, ModelStatus } from "../../../ml/ModelStatus";
import { useEmbeddings } from "../../../ml/useEmbeddings";
import { useModelRun } from "../../../ml/useModelRun";
import { accuracy, argmax } from "../classifier";
import { LABEL_IDS, TEST_TICKETS, ticketVector } from "../model";
import { ZERO_SHOT_TEMPERATURE, zeroShot } from "../zeroShot";

export type Descriptions = Record<string, string>;

/** Live MiniLM vectors for the label descriptions (5 texts, one call). */
export function useLabelVectors(descriptions: Descriptions) {
  const model = useEmbeddings();
  const e = model.embedder;
  const texts = LABEL_IDS.map((l) => descriptions[l] ?? "");
  const run = useModelRun(e ? () => e.embedSentences(texts.map((t) => t || " ")) : null, texts.join("\n"));
  return { model, labelVecs: run.value, error: run.error };
}

export function zeroShotAccuracy(labelVecs: Float32Array[]): number {
  const truth = TEST_TICKETS.map((t) => LABEL_IDS.indexOf(t.label));
  const pred = TEST_TICKETS.map((t) => argmax(zeroShot(ticketVector(t.id), labelVecs).probs));
  return accuracy(truth, pred);
}

export function ZeroShotView({
  descriptions,
  setDescriptions,
  ticketId,
  setTicketId,
}: {
  descriptions: Descriptions;
  setDescriptions: (d: Descriptions) => void;
  ticketId: string;
  setTicketId: (id: string) => void;
}) {
  const { model, labelVecs, error } = useLabelVectors(descriptions);
  const ticket = TEST_TICKETS.find((t) => t.id === ticketId)!;
  const result = useMemo(() => (labelVecs ? zeroShot(ticketVector(ticket.id), labelVecs) : null), [labelVecs, ticket.id]);
  const acc = labelVecs ? zeroShotAccuracy(labelVecs) : null;

  return (
    <Panel title="Zero-shot: compare with label descriptions" icon={<Sparkles size={14} />}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {LABEL_IDS.map((l) => (
            <label key={l} className="block text-sm">
              <span className="font-mono text-xs text-slate-400">{l}</span>
              <input
                aria-label={`Description for ${l}`}
                value={descriptions[l] ?? ""}
                onChange={(e) => setDescriptions({ ...descriptions, [l]: e.target.value })}
                className="mt-0.5 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
              />
            </label>
          ))}
        </div>
        <div>
          <TicketSelect value={ticketId} onChange={setTicketId} />
          <ModelStatus state={model}>
            {error && <ModelRunError />}
            <ul className="mt-2 space-y-1">
              {LABEL_IDS.map((l, i) => (
                <li key={l} data-testid={`zs-score-${l}`} className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-mono text-slate-300">{l}</span>
                  <span className="font-mono text-xs text-slate-400">
                    cos {result ? result.scores[i]!.toFixed(3) : "…"} · {result ? `${(result.probs[i]! * 100).toFixed(1)}%` : "…"}
                  </span>
                </li>
              ))}
            </ul>
            {acc !== null && (
              <p className="mt-3 text-sm text-slate-300">
                With these descriptions: <span className="font-mono">{Math.round(acc * TEST_TICKETS.length)} / {TEST_TICKETS.length}</span> held-out tickets correct.
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Percentages are softmax(cosine / {ZERO_SHOT_TEMPERATURE}): a display choice to turn bunched-up cosines into a split. The cosines are the real
              signal.
            </p>
          </ModelStatus>
        </div>
      </div>
    </Panel>
  );
}

export function TicketSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-300">Held-out ticket</span>
      <select
        aria-label="Test ticket"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
      >
        {TEST_TICKETS.map((t) => (
          <option key={t.id} value={t.id}>
            {t.text}
          </option>
        ))}
      </select>
    </label>
  );
}
