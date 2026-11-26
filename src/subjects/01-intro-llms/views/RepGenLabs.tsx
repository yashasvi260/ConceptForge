/** Concept labs for Module 01, step 10 ("Representation vs generative models"). Real data from Module 06. */
import { useEffect, useMemo, useState } from "react";
import { Panel, Slider, Toggle } from "../../../components/ui";
import { pct, ProbBars } from "./labkit";

type M06 = typeof import("../../06-text-classification/model");
let m06: Promise<M06> | null = null;
const loadM06 = () => (m06 ??= import("../../06-text-classification/model"));

function useM06(load: () => Promise<M06> = loadM06) {
  const [m, setM] = useState<M06 | null>(null);
  useEffect(() => {
    let live = true;
    void load().then((x) => live && setM(x));
    return () => {
      live = false;
    };
  }, [load]);
  return m;
}

const loadingPanel = (title: string) => (
  <Panel title={title}>
    <p role="status" className="text-sm text-slate-400">
      Loading the real ticket data…
    </p>
  </Panel>
);
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i]!, 0);
const norm = (a: number[]) => Math.sqrt(dot(a, a));
const cos = (a: number[], b: number[]) => dot(a, b) / (norm(a) * norm(b));
type Load = { load?: () => Promise<M06> };

/** gemma4's recorded answer and its probability for a test ticket, if it was recorded. */
function genAnswer(m: M06, id: string) {
  const rec = m.CLASSIFY_RECORDINGS.items.find((i) => i.key === `classify:${id}`);
  if (!rec) return null;
  const first = rec.tokens?.[0];
  return { answer: rec.output.trim(), p: first ? Math.exp(first.logprob) : null, ms: rec.durationMs };
}

/* ------------------------------------------------------------------ two jobs, two outputs */

/** Lab: one ticket through a representation model (a vector) and a generative model (a word). */
export function TwoOutputsLab({ load }: Load) {
  const m = useM06(load);
  const [id, setId] = useState("ca03");
  if (!m) return loadingPanel("Two jobs, two outputs");
  const t = m.TEST_TICKETS.find((x) => x.id === id) ?? m.TEST_TICKETS[0]!;
  const v = m.ticketVector(t.id);
  const max = Math.max(...v.map(Math.abs));
  const g = genAnswer(m, t.id);
  return (
    <Panel title="Same ticket, two kinds of model">
      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Ticket
        <select value={t.id} onChange={(e) => setId(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100">
          {m.TEST_TICKETS.map((x) => (
            <option key={x.id} value={x.id}>
              {x.text}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">MiniLM (representation)</div>
          <div aria-label="MiniLM vector" className="mt-2 flex flex-wrap gap-px">
            {v.map((x, i) => (
              <span key={i} className={`h-2.5 w-1 ${x >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ opacity: 0.15 + (0.85 * Math.abs(x)) / max }} />
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400">384 numbers. Useful only once you compare or classify them.</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-violet-300">{m.GEN_MODEL} (generative)</div>
          <p role="status" className="mt-2 font-mono text-lg text-slate-100">
            {g ? g.answer : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-400">{g && g.p !== null ? `probability ${pct(g.p)} · ${g.ms} ms on the recording GPU` : "not recorded"}</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">True label: {t.label}. Real MiniLM vectors and real recorded gemma4 answers (Module 06&apos;s data).</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ nearest centroid */

/** Lab: classify the test tickets by their nearest class average (centroid) of real MiniLM vectors. */
export function CentroidLab({ load }: Load) {
  const m = useM06(load);
  const [perClass, setPerClass] = useState(8);
  const result = useMemo(() => {
    if (!m) return null;
    const centroids = new Map<string, number[]>();
    for (const l of m.LABEL_IDS) {
      const vs = m.TRAIN_TICKETS.filter((t) => t.label === l).slice(0, perClass).map((t) => m.ticketVector(t.id));
      centroids.set(l, vs[0]!.map((_, i) => vs.reduce((s, v) => s + v[i]!, 0) / vs.length));
    }
    const preds = m.TEST_TICKETS.map((t) => {
      const v = m.ticketVector(t.id);
      let best = "";
      let bestC = -Infinity;
      for (const [l, c] of centroids) {
        const s = cos(v, c);
        if (s > bestC) {
          bestC = s;
          best = l;
        }
      }
      return { t, pred: best };
    });
    return { preds, right: preds.filter((p) => p.pred === p.t.label).length };
  }, [m, perClass]);
  if (!m || !result) return loadingPanel("Classifying with vectors");
  const maxPer = Math.min(...m.LABEL_IDS.map((l) => m.TRAIN_TICKETS.filter((t) => t.label === l).length));
  return (
    <Panel title="Classifying with vectors: nearest class average">
      <Slider label="Training examples per class" min={1} max={maxPer} step={1} value={Math.min(perClass, maxPer)} onChange={setPerClass} />
      <p role="status" className="mt-2 text-sm text-slate-200">
        Test accuracy: <span className="font-mono text-violet-300">{result.right} / {result.preds.length}</span> ({pct(result.right / result.preds.length)})
      </p>
      <ul aria-label="Mistakes" className="mt-2 space-y-1 text-xs">
        {result.preds
          .filter((p) => p.pred !== p.t.label)
          .map((p) => (
            <li key={p.t.id} className="text-rose-300">
              “{p.t.text}” → {p.pred} (really {p.t.label})
            </li>
          ))}
      </ul>
      <p className="mt-2 text-[11px] text-slate-500">Each class is the average of its training tickets&apos; real MiniLM vectors; a test ticket gets the class whose average is closest.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ classifying by prompting */

/** Lab: gemma4's recorded answers when prompted to classify the test tickets. */
export function GenClassifyLab({ load }: Load) {
  const m = useM06(load);
  const [showPrompt, setShowPrompt] = useState(false);
  if (!m) return loadingPanel("Classifying with a generative model");
  const rows = m.TEST_TICKETS.map((t) => ({ t, g: genAnswer(m, t.id) })).filter((r) => r.g);
  const right = rows.filter((r) => r.g!.answer === r.t.label).length;
  return (
    <Panel title={`Classifying by prompting (${m.GEN_MODEL}, recorded)`}>
      <Toggle label="Show the prompt" checked={showPrompt} onChange={setShowPrompt} />
      {showPrompt && <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-2 font-mono text-[11px] text-slate-300">{m.promptFor(rows[0]!.t.text)}</pre>}
      <p role="status" className="mt-2 text-sm text-slate-200">
        {right} / {rows.length} correct ({pct(right / rows.length)})
      </p>
      <ProbBars label="gemma4's confidence on each answer" items={rows.slice(0, 8).map((r) => ({ label: `${r.t.id} → ${r.g!.answer}`, value: r.g!.p ?? 0, highlight: r.g!.answer === r.t.label, muted: r.g!.answer !== r.t.label }))} />
      <p className="mt-2 text-[11px] text-slate-500">Real answers and token probabilities recorded from {m.GEN_MODEL}; the first 8 shown.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ the cost gap */

const MINILM = 22_713_216;
const GEMMA = 11.9e9;

/** Lab: compute per ticket for each approach, and gemma4's measured time per answer. */
export function CostGapLab({ load }: Load) {
  const m = useM06(load);
  const [perDay, setPerDay] = useState(100_000);
  if (!m) return loadingPanel("The cost gap");
  const items = m.CLASSIFY_RECORDINGS.items;
  const avgMs = items.reduce((s, i) => s + i.durationMs, 0) / items.length;
  const promptTokens = items[0]!.promptEvalCount ?? 77;
  const ticketTokens = 25;
  const embedFlops = 2 * MINILM * ticketTokens;
  const genFlops = 2 * GEMMA * (promptTokens + 2);
  return (
    <Panel title="The cost gap, in numbers">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Cost per ticket</caption>
        <tbody>
          <tr className="border-t border-slate-800"><td className="py-1 text-slate-300">MiniLM vector (~{ticketTokens} tokens)</td><td className="py-1 font-mono text-slate-100">{embedFlops.toExponential(1)} FLOPs</td></tr>
          <tr className="border-t border-slate-800"><td className="py-1 text-slate-300">gemma4 answer ({promptTokens} prompt tokens + answer)</td><td className="py-1 font-mono text-slate-100">{genFlops.toExponential(1)} FLOPs</td></tr>
          <tr className="border-t border-slate-800"><td className="py-1 text-slate-300">gemma4 measured time per answer</td><td className="py-1 font-mono text-slate-100">{avgMs.toFixed(1)} ms</td></tr>
        </tbody>
      </table>
      <div className="mt-3">
        <Slider label="Tickets per day" min={1000} max={10_000_000} step={1000} value={perDay} onChange={setPerDay} format={(v) => v.toLocaleString("en-US")} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        gemma4 needs about <span className="font-mono text-violet-300">{Math.round(genFlops / embedFlops).toLocaleString("en-US")}×</span> the compute per ticket; at {perDay.toLocaleString("en-US")} a day that&apos;s {((avgMs * perDay) / 3_600_000).toFixed(1)} GPU-hours of answering at the measured speed.
      </p>
      <p className="mt-1 text-[11px] text-slate-500">FLOPs ≈ 2 · parameters · tokens (step 4). Time: average of {items.length} real recorded gemma4 answers on one GPU, prompt included.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ choosing in practice */

/** Lab: answer a few questions about your task; get a recommendation and the reasons. */
export function ChooseLab() {
  const [fixedLabels, setFixed] = useState(true);
  const [labelled, setLabelled] = useState(true);
  const [needText, setNeedText] = useState(false);
  const [highVolume, setHighVolume] = useState(true);
  const reasons: string[] = [];
  let pick: string;
  if (needText) {
    pick = "A generative model";
    reasons.push("you need text out (an explanation, a reply), which only a generative model writes");
  } else if (fixedLabels && labelled) {
    pick = "A representation model with a small classifier";
    reasons.push("fixed labels with examples: train a head on vectors (fast, cheap, measurable)");
    if (highVolume) reasons.push("high volume makes the generative model's cost add up quickly");
  } else if (!labelled) {
    pick = "A generative model (prompted), or embedding similarity to label descriptions";
    reasons.push("no labelled examples: zero-shot prompting or matching to label descriptions needs none");
  } else {
    pick = "A generative model";
    reasons.push("open-ended or changing categories are easy to describe in a prompt");
  }
  return (
    <Panel title="Choosing in practice">
      <div className="grid gap-2 sm:grid-cols-2">
        <Toggle label="The categories are fixed" checked={fixedLabels} onChange={setFixed} />
        <Toggle label="I have labelled examples" checked={labelled} onChange={setLabelled} />
        <Toggle label="I need an explanation or reply in words" checked={needText} onChange={setNeedText} />
        <Toggle label="High volume (thousands a day or more)" checked={highVolume} onChange={setHighVolume} />
      </div>
      <p role="status" className="mt-3 text-sm text-slate-200">
        <span className="font-semibold text-violet-300">{pick}</span>: {reasons.join("; ")}.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ combining them */

/** Lab: retrieve the most similar past tickets with MiniLM, then build the prompt an LLM would answer from. */
export function CombineLab({ load }: Load) {
  const m = useM06(load);
  const [id, setId] = useState("fr03");
  if (!m) return loadingPanel("Combining them");
  const q = m.TICKETS.find((x) => x.id === id) ?? m.TEST_TICKETS[0]!;
  const qv = m.ticketVector(q.id);
  const hits = m.TRAIN_TICKETS.map((t) => ({ t, c: cos(qv, m.ticketVector(t.id)) }))
    .sort((a, b) => b.c - a.c)
    .slice(0, 3);
  const prompt = `Similar past tickets:\n${hits.map((h) => `- "${h.t.text}" (${h.t.label})`).join("\n")}\n\nNew ticket: "${q.text}"\nWhich category, and what should the agent do first?`;
  return (
    <Panel title="Combining them: retrieve, then prompt">
      <label className="flex flex-col gap-1 text-xs text-slate-400">
        New ticket
        <select value={q.id} onChange={(e) => setId(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100">
          {m.TEST_TICKETS.map((x) => (
            <option key={x.id} value={x.id}>
              {x.text}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-3">
        <ProbBars label="Step 1: MiniLM finds the closest past tickets" format={(v) => v.toFixed(3)} items={hits.map((h) => ({ label: `${h.t.id} (${h.t.label})`, value: h.c, note: h.t.text }))} />
      </div>
      <h4 className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Step 2: the prompt a generative model would answer</h4>
      <pre role="status" className="mt-1 whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-2 font-mono text-[11px] text-slate-200">
        {prompt}
      </pre>
      <p className="mt-1 text-[11px] text-slate-500">Retrieval uses real MiniLM vectors. The cheap model narrows millions of records to a few; the expensive one reads only those.</p>
    </Panel>
  );
}
