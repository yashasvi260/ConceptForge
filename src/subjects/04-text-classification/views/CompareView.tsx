import { Gauge } from "lucide-react";
import { useState } from "react";
import { Panel, Slider } from "../../../components/ui";
import { GenerationPanel } from "../../../llm/GenerationPanel";
import { ModelStatus } from "../../../ml/ModelStatus";
import { useEmbeddings } from "../../../ml/useEmbeddings";
import { useModelRun } from "../../../ml/useModelRun";
import { accuracy, argmax } from "../classifier";
import { estimateCost } from "../cost";
import { CLASSIFY_RECORDINGS, GEN_MODEL, LABEL_IDS, TEST_TICKETS, defaultHead, generativeVerdict, headVerdict, promptFor, recordingFor } from "../model";
import { zeroShot } from "../zeroShot";
import { evaluateHead } from "./TrainView";
import { TicketSelect, useLabelVectors, zeroShotAccuracy, type Descriptions } from "./ZeroShotView";

const pct = (p: number) => `${(p * 100).toFixed(1)}%`;

function Verdict({ name, label, conf, latency, cost, children }: { name: string; label: string | null; conf: string; latency: string; cost: string; children?: React.ReactNode }) {
  return (
    <section aria-label={name} className="space-y-1.5 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm">
      <h4 className="font-semibold text-slate-100">{name}</h4>
      <p data-testid="verdict" className="font-mono text-lg text-cyan-300">
        {label ?? "…"}
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
        <dt className="text-slate-500">confidence</dt>
        <dd className="font-mono text-slate-300">{conf}</dd>
        <dt className="text-slate-500">latency</dt>
        <dd className="font-mono text-slate-300">{latency}</dd>
        <dt className="text-slate-500">cost</dt>
        <dd className="font-mono text-slate-300">{cost}</dd>
      </dl>
      {children}
    </section>
  );
}

export function CompareView({ ticketId, setTicketId, descriptions }: { ticketId: string; setTicketId: (id: string) => void; descriptions: Descriptions }) {
  const [draft, setDraft] = useState("");
  const [custom, setCustom] = useState<string | null>(null);
  const [price, setPrice] = useState(0.5);
  const test = TEST_TICKETS.find((t) => t.id === ticketId)!;
  const text = custom ?? test.text;

  const model = useEmbeddings();
  const e = model.embedder;
  const run = useModelRun(
    e
      ? async () => {
          const t0 = performance.now();
          const [v] = await e.embedSentences([text]);
          return { v: v!, ms: performance.now() - t0 };
        }
      : null,
    text,
  );
  const { labelVecs } = useLabelVectors(descriptions);

  const head = run.value ? headVerdict(defaultHead(), run.value.v) : null;
  const zs = run.value && labelVecs ? zeroShot(run.value.v, labelVecs) : null;
  const rec = custom === null ? recordingFor(test.id) : undefined;
  const gen = rec ? generativeVerdict(rec) : null;
  const genTokens = rec ? (rec.promptEvalCount ?? 0) + rec.evalCount : null;
  const embedMs = run.value ? `${run.value.ms.toFixed(0)} ms (MiniLM in your browser)` : "…";

  const genAcc = accuracy(
    TEST_TICKETS.map((t) => LABEL_IDS.indexOf(t.label)),
    TEST_TICKETS.map((t) => {
      const r = recordingFor(t.id);
      return r ? LABEL_IDS.indexOf(generativeVerdict(r).label ?? "") : -1;
    }),
  );

  return (
    <Panel title="3-way comparator" icon={<Gauge size={14} />}>
      <div className="grid gap-3 md:grid-cols-2">
        <TicketSelect
          value={ticketId}
          onChange={(id) => {
            setCustom(null);
            setTicketId(id);
          }}
        />
        <div className="text-sm">
          <label className="block">
            <span className="text-slate-300">Or type your own</span>
            <textarea
              aria-label="Your own ticket"
              rows={2}
              value={draft}
              onChange={(ev) => setDraft(ev.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
            />
          </label>
          <button
            type="button"
            disabled={!draft.trim()}
            onClick={() => setCustom(draft.trim())}
            className="mt-1 rounded-lg bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-40"
          >
            Classify my ticket
          </button>
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        Classifying: <span className="text-slate-200">“{text}”</span>
        {custom === null && <span className="ml-1 font-mono text-xs text-slate-500">(true label: {test.label})</span>}
      </p>
      <ModelStatus state={model}>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <Verdict name="Classifier head" label={head?.label ?? null} conf={head ? pct(head.p) : "…"} latency={embedMs} cost="$0 API cost (runs on this device)" />
          <Verdict
            name="Zero-shot"
            label={zs ? LABEL_IDS[argmax(zs.probs)]! : null}
            conf={zs ? `cos ${Math.max(...zs.scores).toFixed(2)}` : "…"}
            latency={embedMs}
            cost="$0 API cost (runs on this device)"
          />
          <Verdict
            name="Generative (gemma4)"
            label={gen?.label ?? (rec ? rec.output : null)}
            conf={gen?.p != null ? pct(gen.p) : "–"}
            latency={rec ? `${rec.durationMs} ms (recorded, local GPU)` : "–"}
            cost={genTokens !== null ? `≈ $${estimateCost(genTokens, price).toFixed(6)} (${genTokens} tokens)` : "–"}
          >
            <GenerationPanel title="Answer" file={CLASSIFY_RECORDINGS} recording={rec} live={{ request: { model: GEN_MODEL, prompt: promptFor(text), temperature: 0, logprobs: true } }} />
          </Verdict>
        </div>
      </ModelStatus>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Slider label="Assumed API price ($ per million tokens)" value={price} min={0} max={5} step={0.05} onChange={setPrice} format={(v) => `$${v.toFixed(2)}`} hint="Your assumption: prices differ by provider and model. Token counts are gemma4's own." />
        <table aria-label="Accuracy on held-out tickets" className="text-sm">
          <tbody>
            <tr>
              <td className="pr-3 text-slate-400">Head</td>
              <td className="font-mono text-slate-200">{pct(evaluateHead(defaultHead()).acc)}</td>
            </tr>
            <tr>
              <td className="pr-3 text-slate-400">Zero-shot</td>
              <td className="font-mono text-slate-200">{labelVecs ? pct(zeroShotAccuracy(labelVecs)) : "…"}</td>
            </tr>
            <tr>
              <td className="pr-3 text-slate-400">gemma4</td>
              <td className="font-mono text-slate-200">{pct(genAcc)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
