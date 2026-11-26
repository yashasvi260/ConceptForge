/** Concept labs for Module 01, step 9 ("Encoder-decoder models"). */
import { RotateCcw, StepForward } from "lucide-react";
import { useState } from "react";
import { Panel, Slider, Toggle } from "../../../components/ui";
import captured from "../deep/local-outputs.json";
import { ProbBars } from "./labkit";

const btn = "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 disabled:opacity-40";
const INPUT = ["the", "cat", "sleeps"];
const TARGET = ["le", "chat", "dort"];

/* ------------------------------------------------------------------ two stacks: run counter */

/** Lab: the encoder reads once; the decoder runs once per output word. */
export function TwoStacksLab() {
  const [written, setWritten] = useState(0);
  const done = written >= TARGET.length;
  return (
    <Panel title="Two stacks: who runs, and how often">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Encoder · reads both ways</div>
          <p className="mt-2 font-mono text-sm text-slate-200">{INPUT.join(" ")}</p>
          <p className="mt-1 text-xs text-slate-400">runs: 1 (its vectors are kept as the “memory”)</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-violet-300">Decoder · writes left to right</div>
          <p className="mt-2 font-mono text-sm text-slate-200">
            &lt;start&gt; {TARGET.slice(0, written).join(" ")}
            {!done && <span className="ml-1 animate-pulse text-violet-300">▍</span>}
          </p>
          <p className="mt-1 text-xs text-slate-400">runs: {written}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" className={btn} disabled={done} onClick={() => setWritten((w) => w + 1)}>
          <StepForward size={14} aria-hidden="true" /> Write the next word
        </button>
        <button type="button" className={btn} onClick={() => setWritten(0)}>
          <RotateCcw size={14} aria-hidden="true" /> Reset
        </button>
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        Encoder runs: 1 · decoder runs: {written}
        {done ? " · done: the long input was read once, however many words were written." : ""}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">The words are the correct translation, used to show the order of work; the lab doesn&apos;t run a model.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ cross-attention by hand */

const MEMORY: [number, number][] = [
  [1, 0],
  [0, 1],
  [0.5, 0.5],
];

export function crossAttention(q: [number, number], causalOnInput: boolean, step = 1) {
  const scores = MEMORY.map((k, j) => (causalOnInput && j > step ? -Infinity : (q[0] * k[0] + q[1] * k[1]) / Math.SQRT2));
  const m = Math.max(...scores);
  const e = scores.map((s) => (s === -Infinity ? 0 : Math.exp(s - m)));
  const z = e.reduce((a, b) => a + b, 0);
  const w = e.map((x) => x / z);
  const mixed: [number, number] = [w.reduce((s, x, j) => s + x * MEMORY[j]![0], 0), w.reduce((s, x, j) => s + x * MEMORY[j]![1], 0)];
  return { scores, w, mixed };
}

/** Lab: the worked example's cross-attention, with the decoder's query adjustable. */
export function CrossAttentionLab() {
  const [q0, setQ0] = useState(0.2);
  const [q1, setQ1] = useState(1);
  const [wrongMask, setWrongMask] = useState(false);
  const { w, mixed } = crossAttention([q0, q1], wrongMask);
  return (
    <Panel title="Cross-attention by hand (toy vectors from the worked example)">
      <p className="text-sm text-slate-300">
        The decoder has written <span className="font-mono">le</span> and asks the encoder&apos;s memory which input word matters now.
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <Slider label="Query, number 1" min={-1} max={1.5} step={0.1} value={q0} onChange={setQ0} format={(v) => v.toFixed(1)} />
        <Slider label="Query, number 2" min={-1} max={1.5} step={0.1} value={q1} onChange={setQ1} format={(v) => v.toFixed(1)} />
      </div>
      <div className="mt-2">
        <Toggle label="Put a causal mask on cross-attention (a mistake)" checked={wrongMask} onChange={setWrongMask} />
      </div>
      <div className="mt-3">
        <ProbBars label="Attention on each input word" format={(v) => v.toFixed(3)} items={INPUT.map((t, j) => ({ label: t, value: w[j]!, highlight: w[j] === Math.max(...w) }))} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        Mixed vector sent to the decoder: <span className="font-mono text-violet-300">({mixed[0].toFixed(3)}, {mixed[1].toFixed(3)})</span>
        {wrongMask ? " — sleeps is now invisible, though it's part of the input the decoder must translate." : ""}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Hand-picked 2-number vectors: the → (1, 0), cat → (0, 1), sleeps → (0.5, 0.5). Query (0.2, 1.0) is the worked example.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ teacher forcing vs generation */

/** Lab: what the decoder is fed in training (the true previous words) vs at generation (its own words). */
export function TeacherForcingLab() {
  const [mode, setMode] = useState<"train" | "generate">("train");
  const [mistake, setMistake] = useState(false);
  const own = mistake ? ["le", "chien", "dort"] : TARGET;
  const inputs = mode === "train" ? ["<start>", ...TARGET.slice(0, -1)] : ["<start>", ...own.slice(0, -1)];
  return (
    <Panel title="Training vs generating">
      <div className="grid gap-2 sm:grid-cols-2">
        <Toggle label="Generating (feed back its own words)" checked={mode === "generate"} onChange={(v) => setMode(v ? "generate" : "train")} />
        <Toggle label="The model got word 2 wrong" checked={mistake} onChange={setMistake} />
      </div>
      <table className="mt-3 w-full text-left text-sm">
        <caption className="sr-only">Decoder inputs and outputs</caption>
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="py-1 font-medium">step</th>
            <th className="py-1 font-medium">decoder is fed</th>
            <th className="py-1 font-medium">{mode === "train" ? "must predict" : "writes"}</th>
          </tr>
        </thead>
        <tbody>
          {inputs.map((x, i) => (
            <tr key={i} className="border-t border-slate-800">
              <td className="py-1 text-slate-400">{i + 1}</td>
              <td className={`py-1 font-mono ${mode === "generate" && mistake && x === "chien" ? "text-rose-300" : "text-slate-200"}`}>{x}</td>
              <td className={`py-1 font-mono ${mode === "generate" && mistake && own[i] !== TARGET[i] ? "text-rose-300" : "text-emerald-300"}`}>{mode === "train" ? TARGET[i] : own[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p role="status" className="mt-2 text-sm text-slate-200">
        {mode === "train"
          ? "Training feeds the correct previous words (teacher forcing), so all positions are predicted in parallel and one mistake can't spread."
          : mistake
            ? "Generating feeds back the model's own words: the mistake “chien” becomes input for every later step."
            : "Generating feeds back the model's own words, one step at a time."}
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ cost */

/** Lab: attention comparisons for an encoder-decoder vs a decoder-only model, by input and output length. */
export function EncDecCostLab() {
  const [tin, setTin] = useState(1000);
  const [tout, setTout] = useState(100);
  const enc = tin * tin;
  const decSelf = (tout * (tout + 1)) / 2;
  const cross = tout * tin;
  const total = tin + tout;
  const decOnly = (total * (total + 1)) / 2;
  const f = (n: number) => Math.round(n).toLocaleString("en-US");
  return (
    <Panel title="What it costs: attention comparisons">
      <div className="grid gap-2 sm:grid-cols-2">
        <Slider label="Input length (tokens)" min={10} max={5000} step={10} value={tin} onChange={setTin} format={f} />
        <Slider label="Output length (tokens)" min={1} max={2000} step={1} value={tout} onChange={setTout} format={f} />
      </div>
      <table className="mt-3 w-full text-left text-sm">
        <caption className="sr-only">Comparisons</caption>
        <tbody>
          <tr className="border-t border-slate-800"><td className="py-1 text-slate-300">encoder self-attention (once): T_in²</td><td className="py-1 font-mono text-slate-100">{f(enc)}</td></tr>
          <tr className="border-t border-slate-800"><td className="py-1 text-slate-300">decoder self-attention (causal)</td><td className="py-1 font-mono text-slate-100">{f(decSelf)}</td></tr>
          <tr className="border-t border-slate-800"><td className="py-1 text-slate-300">cross-attention: T_out × T_in</td><td className="py-1 font-mono text-slate-100">{f(cross)}</td></tr>
          <tr className="border-t border-slate-800"><td className="py-1 text-slate-300">decoder-only, one causal sequence of T_in + T_out</td><td className="py-1 font-mono text-violet-300">{f(decOnly)}</td></tr>
        </tbody>
      </table>
      <p role="status" className="mt-2 text-xs text-slate-400">Comparisons per head, per block, for the whole job. Real cost also depends on widths, layers and caching (Module 16).</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ decoder-only: one sequence */

const SEQ = ["Translate", "to", "French:", "the", "cat", "sleeps", "⇒", "le", "chat", "dort"];
const FIRST_OUTPUT = 7;

/** Lab: a decoder-only model puts the input and output in one sequence; causal attention plays cross-attention's role. */
export function DecoderOnlyLab() {
  const [pos, setPos] = useState(8);
  return (
    <Panel title="Decoder-only: one sequence does both jobs">
      <Slider label="Token being written" min={FIRST_OUTPUT} max={SEQ.length - 1} step={1} value={pos} onChange={setPos} format={(v) => SEQ[v]!} />
      <p role="status" className="mt-3 flex flex-wrap gap-1.5">
        {SEQ.map((t, i) => (
          <span key={i} className={`rounded border px-1.5 py-0.5 font-mono text-xs ${i === pos ? "border-violet-500 bg-violet-500/15 text-violet-200" : i < pos ? (i < FIRST_OUTPUT ? "border-emerald-500/60 text-emerald-200" : "border-slate-600 text-slate-200") : "border-slate-800 text-slate-600 line-through"}`}>
            {t}
          </span>
        ))}
      </p>
      <p className="mt-2 text-xs text-slate-400">Green: the input, reachable by ordinary causal attention because it sits earlier in the same sequence. Struck out: not written yet.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ a real T5 run */

const ENC = (captured as Record<string, { output: string; packages: Record<string, string>; ranAt: string }>).encdec!;

/** Lab: the captured output of really running T5-small, including its mistake. */
export function T5RunLab() {
  const lines = ENC.output.split("\n");
  return (
    <Panel title="A real encoder-decoder run (T5-small)">
      <pre aria-label="Captured output" className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200">
        {lines.join("\n")}
      </pre>
      <p role="status" className="mt-2 text-sm text-slate-200">
        Notice “Le chat dorme.”: real T5-small gets the verb wrong (French is “Le chat dort.”). Small models make real mistakes, and this page shows them.
      </p>
      <p className="mt-1 text-[11px] text-slate-500">
        Captured {ENC.ranAt} with transformers {ENC.packages.transformers} (CPU, greedy decoding). The code is in this step&apos;s “Run it locally” listing.
      </p>
    </Panel>
  );
}
