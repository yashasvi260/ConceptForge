/** Concept labs for Module 01, step 11 ("Pre-training, then fine-tuning"). */
import { useEffect, useMemo, useState } from "react";
import { Panel, Slider, Toggle } from "../../../components/ui";
import { bagOfWords } from "../bow";
import { pct, ProbBars } from "./labkit";

/* ------------------------------------------------------------------ fine-tuning data and the loss mask */

const SFT = [
  { role: "system", content: "You are a helpful bank assistant." },
  { role: "user", content: "How do I reset my PIN?" },
  { role: "assistant", content: "Open the app, go to Card settings and choose Reset PIN." },
];

/** Lab: one instruction-tuning example in Llama 3's chat format, and which part the loss is computed on. */
export function FinetuneFormatLab() {
  const [maskPrompt, setMaskPrompt] = useState(true);
  const segments = [
    { text: "<|begin_of_text|>", counts: false },
    ...SFT.flatMap((m) => [
      { text: `<|start_header_id|>${m.role}<|end_header_id|>\n\n`, counts: false },
      { text: m.content, counts: m.role === "assistant" || !maskPrompt },
      { text: "<|eot_id|>", counts: m.role === "assistant" },
    ]),
  ];
  return (
    <Panel title="An instruction-tuning example">
      <Toggle label="Compute the loss on the assistant's reply only" checked={maskPrompt} onChange={setMaskPrompt} />
      <pre aria-label="Training example" className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-relaxed">
        {segments.map((s, i) => (
          <span key={i} className={s.counts ? "rounded bg-emerald-500/20 text-emerald-200" : "text-slate-500"}>
            {s.text}
          </span>
        ))}
      </pre>
      <p role="status" className="mt-2 text-sm text-slate-200">
        {maskPrompt
          ? "Green = the tokens the model is trained to predict: only the reply. It learns to answer, not to imitate users."
          : "Training on everything also teaches the model to write user and system messages, which is usually not what you want."}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Llama 3&apos;s real chat format (Module 02, step 8). The loss and gradient steps are the same as pre-training; only the data changes.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ transfer: word counts vs pretrained vectors */

type M06 = typeof import("../../06-text-classification/model");
let m06: Promise<M06> | null = null;
const loadM06 = () => (m06 ??= import("../../06-text-classification/model"));
const cosine = (a: number[], b: number[]) => {
  let d = 0;
  let x = 0;
  let y = 0;
  a.forEach((v, i) => {
    d += v * b[i]!;
    x += v * v;
    y += b[i]! * b[i]!;
  });
  return d / (Math.sqrt(x * y) || 1e-12);
};

export function centroidAccuracy(m: M06, feature: (id: string) => number[], perClass: number): number {
  const cents = m.LABEL_IDS.map((l) => {
    const vs = m.TRAIN_TICKETS.filter((t) => t.label === l).slice(0, perClass).map((t) => feature(t.id));
    return { l, c: vs[0]!.map((_, i) => vs.reduce((s, v) => s + v[i]!, 0) / vs.length) };
  });
  return m.TEST_TICKETS.filter((t) => {
    const v = feature(t.id);
    let best = cents[0]!;
    let bestS = -Infinity;
    for (const c of cents) {
      const s = cosine(v, c.c);
      if (s > bestS) {
        bestS = s;
        best = c;
      }
    }
    return best.l === t.label;
  }).length;
}

/** Lab: the same tiny classifier on word counts (nothing pre-trained) and on MiniLM vectors (pre-trained). */
export function TransferLab({ load = loadM06 }: { load?: () => Promise<M06> }) {
  const [m, setM] = useState<M06 | null>(null);
  useEffect(() => {
    let live = true;
    void load().then((x) => live && setM(x));
    return () => {
      live = false;
    };
  }, [load]);
  const [k, setK] = useState(2);
  const bow = useMemo(() => {
    if (!m) return null;
    const { counts } = bagOfWords(m.TICKETS.map((t) => t.text));
    const byId = new Map(m.TICKETS.map((t, i) => [t.id, counts[i]!]));
    return (id: string) => byId.get(id)!;
  }, [m]);
  if (!m || !bow) return <Panel title="Transfer"><p role="status" className="text-sm text-slate-400">Loading the real ticket data…</p></Panel>;
  const n = m.TEST_TICKETS.length;
  const a = centroidAccuracy(m, bow, k);
  const b = centroidAccuracy(m, m.ticketVector, k);
  return (
    <Panel title="Why fine-tuning works: transfer">
      <Slider label="Labelled examples per class" min={1} max={8} step={1} value={k} onChange={setK} />
      <div className="mt-3">
        <ProbBars
          label="Test accuracy on 20 real tickets"
          items={[
            { label: "word counts (nothing learned before)", value: a / n },
            { label: "MiniLM vectors (pre-trained)", value: b / n, highlight: true },
          ]}
        />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        Same classifier, same {k * m.LABEL_IDS.length} labelled tickets: {a}/{n} with word counts, {b}/{n} with pre-trained vectors.
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Nearest class average on Module 06&apos;s real tickets and MiniLM vectors. The pre-trained model already knows what money words mean.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ forgetting (the worked example's bigram model) */

const GENERAL = "the cat sat on the mat . the dog ate the food . the cat ate the fish .".split(" ");
const BANKING = "the bank approved the loan . the loan was repaid .".split(" ");

export function afterThe(passes: number, mixGeneral: boolean) {
  const counts = new Map<string, number>();
  const add = (tokens: string[]) => {
    for (let i = 0; i + 1 < tokens.length; i++) if (tokens[i] === "the") counts.set(tokens[i + 1]!, (counts.get(tokens[i + 1]!) ?? 0) + 1);
  };
  add(GENERAL);
  for (let p = 0; p < passes; p++) {
    add(BANKING);
    if (mixGeneral) add(GENERAL);
  }
  const total = [...counts.values()].reduce((x, y) => x + y, 0);
  return { cat: (counts.get("cat") ?? 0) / total, loan: (counts.get("loan") ?? 0) / total };
}

/** Lab: the worked example's bigram model; more passes over banking text push out general knowledge. */
export function ForgettingLab() {
  const [passes, setPasses] = useState(1);
  const [mix, setMix] = useState(false);
  const r = afterThe(passes, mix);
  return (
    <Panel title="Catastrophic forgetting, in miniature">
      <Slider label="Passes over the banking text" min={0} max={30} step={1} value={passes} onChange={setPasses} />
      <div className="mt-2">
        <Toggle label="Mix the general text back in on every pass" checked={mix} onChange={setMix} />
      </div>
      <div className="mt-3">
        <ProbBars
          label="After “the”"
          items={[
            { label: "P(cat) general", value: r.cat },
            { label: "P(loan) banking", value: r.loan },
          ]}
        />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        After {passes} pass{passes === 1 ? "" : "es"}: P(cat | the) = {pct(r.cat)}
        {!mix && passes >= 10 ? " — the model is turning into a banking parrot." : mix ? " — mixing in general data keeps what it knew." : ""}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">The worked example&apos;s two texts and counting model. Real LLMs change weights by gradient descent, but the shape is the same.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ how much data each stage needs */

const STAGES: { label: string; amount: number; unit: string; source: string }[] = [
  { label: "Llama 3 pre-training", amount: 15e12, unit: "tokens", source: "Meta's Llama 3 model card" },
  { label: "InstructGPT reward model", amount: 33e3, unit: "prompts with ranked answers", source: "Ouyang et al. 2022" },
  { label: "InstructGPT RL fine-tuning", amount: 31e3, unit: "prompts", source: "Ouyang et al. 2022" },
  { label: "InstructGPT supervised fine-tuning", amount: 13e3, unit: "prompts with written answers", source: "Ouyang et al. 2022" },
  { label: "This course's ticket classifier", amount: 40, unit: "labelled tickets", source: "Module 06" },
];

/** Lab: data per stage on a log scale, and the compute of pre-training vs fine-tuning (6 · N · D). */
export function DataPerStageLab() {
  const [ftTokens, setFt] = useState(10);
  const lo = 1;
  const hi = Math.log10(2e13);
  const pre = 6 * 8.03e9 * 15e12;
  const ft = 6 * 8.03e9 * ftTokens * 1e6;
  return (
    <Panel title="How much data each stage needs (log scale)">
      <ProbBars
        label="Training data per stage"
        format={(v) => {
          const n = 10 ** (lo + v * (hi - lo));
          return n >= 1e9 ? `${(n / 1e12).toFixed(0)}T` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(Math.round(n));
        }}
        items={STAGES.map((s) => ({ label: s.label, value: (Math.log10(s.amount) - lo) / (hi - lo), note: `${s.amount.toLocaleString("en-US")} ${s.unit} (${s.source})` }))}
      />
      <div className="mt-3">
        <Slider label="Fine-tuning tokens (millions)" min={1} max={10000} step={1} value={ftTokens} onChange={setFt} format={(v) => v.toLocaleString("en-US")} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        Pre-training an 8B model: {pre.toExponential(1)} FLOPs. Fine-tuning on {ftTokens.toLocaleString("en-US")}M tokens: {ft.toExponential(1)} FLOPs, about{" "}
        <span className="font-mono text-violet-300">{Math.round(pre / ft).toLocaleString("en-US")}×</span> less.
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Each step right is 10× more data; hover a bar for the exact figure and its source. Units differ: tokens, prompts, tickets.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ from base model to assistant */

const STAGE_DATA = [
  { stage: "1. Pre-training", data: "…the capital of France is Paris, which is also its largest city. The capital of Spain is…", learns: "Language, facts, styles: continue any text." },
  { stage: "2. Supervised instruction tuning", data: "User: What is the capital of France?\nAssistant: The capital of France is Paris.", learns: "To answer instead of just continuing." },
  { stage: "3. Preference tuning", data: "Prompt: Explain inflation to a child.\nPreferred: a short, friendly analogy.\nRejected: a dense paragraph of jargon.", learns: "Which of two answers people prefer: helpful, honest, safe." },
];

/** Lab: what each training stage's data looks like (example records, not model outputs). */
export function BaseToAssistantLab() {
  const [i, setI] = useState(0);
  const s = STAGE_DATA[i]!;
  return (
    <Panel title="From base model to assistant">
      <div role="group" aria-label="Stage" className="flex flex-wrap gap-1.5">
        {STAGE_DATA.map((x, k) => (
          <button key={x.stage} type="button" aria-pressed={k === i} onClick={() => setI(k)} className={`rounded-full border px-2.5 py-0.5 text-xs ${k === i ? "border-violet-500 bg-violet-500/15 text-violet-200" : "border-slate-700 text-slate-400"}`}>
            {x.stage}
          </button>
        ))}
      </div>
      <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200">{s.data}</pre>
      <p role="status" className="mt-2 text-sm text-slate-200">
        <span className="font-semibold text-violet-300">Learns:</span> {s.learns}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Example records showing each stage&apos;s data format, written for this lab; not model outputs.</p>
    </Panel>
  );
}
