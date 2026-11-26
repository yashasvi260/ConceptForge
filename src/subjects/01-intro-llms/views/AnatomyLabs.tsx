/** Concept labs for Module 01, step 2 ("Anatomy of an LLM"). */
import { Tiktoken } from "js-tiktoken/lite";
import { useEffect, useMemo, useState } from "react";
import { Panel, Slider, Toggle } from "../../../components/ui";
import { MODEL_CONFIGS } from "../modelConfigs";
import { choicesAt } from "../generationLab";
import { nodeAt, pct, ProbBars, RecordedNote, showToken, useGenRecording, type GenRecording } from "./labkit";

const GPT2 = MODEL_CONFIGS.find((c) => c.id === "gpt2-small")!;
const num = (x: number, d = 3) => (Number.isFinite(x) ? Number(x.toFixed(d)).toString() : x > 0 ? "∞" : "−∞");

/* ------------------------------------------------------------------ token lookup (real GPT-2 tokenizer) */

let gpt2: Promise<Tiktoken> | null = null;
const loadGpt2 = () => (gpt2 ??= import("js-tiktoken/ranks/gpt2").then((m) => new Tiktoken(m.default)));

/** Lab: real GPT-2 token IDs for any text, and the rows of the embedding table they select. */
export function TokenLookupLab({ load = loadGpt2 }: { load?: () => Promise<Tiktoken> }) {
  const [enc, setEnc] = useState<Tiktoken | null>(null);
  const [text, setText] = useState("The cat sat on the mat");
  useEffect(() => {
    let live = true;
    void load().then((e) => live && setEnc(e));
    return () => {
      live = false;
    };
  }, [load]);
  const ids = enc ? enc.encode(text) : [];
  return (
    <Panel title="Text → token IDs → rows of the embedding table">
      <label className="block text-xs text-slate-400">
        Your text
        <input value={text} onChange={(e) => setText(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100" />
      </label>
      {!enc ? (
        <p role="status" className="mt-3 text-sm text-slate-400">
          Loading GPT-2's real tokenizer…
        </p>
      ) : (
        <>
          <table className="mt-3 w-full text-left text-sm">
            <caption className="sr-only">Tokens and their IDs</caption>
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="py-1 font-medium">token</th>
                <th className="py-1 font-medium">ID = row of the table</th>
                <th className="py-1 font-medium">what the model gets</th>
              </tr>
            </thead>
            <tbody>
              {ids.slice(0, 16).map((id, i) => (
                <tr key={i} className="border-t border-slate-800">
                  <td className="py-1 font-mono text-slate-100">{showToken(enc.decode([id]))}</td>
                  <td className="py-1 font-mono text-violet-300">{id}</td>
                  <td className="py-1 text-xs text-slate-400">row {id}: {GPT2.dModel} learned numbers</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p role="status" className="mt-3 text-sm text-slate-300">
            {ids.length} tokens → a <span className="font-mono">{ids.length} × {GPT2.dModel}</span> grid of numbers, read from a table of{" "}
            <span className="font-mono">{GPT2.vocab.toLocaleString("en-US")} × {GPT2.dModel}</span>.
          </p>
          <p className="mt-1 text-[11px] text-slate-500">GPT-2's real tokenizer (OpenAI tiktoken). ␣ marks the space that is part of the token.</p>
        </>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ position information */

const D_POS = 8;
/** The transformer paper's sinusoidal position signal: sin on even dimensions, cos on odd ones. */
export function sinusoid(pos: number, d = D_POS): number[] {
  return Array.from({ length: d }, (_, i) => {
    const angle = pos / 10000 ** ((2 * Math.floor(i / 2)) / d);
    return i % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
  });
}

/** Lab: without positions two sentences are the same bag of tokens; with positions they differ. */
export function PositionLab() {
  const [withPos, setWithPos] = useState(false);
  const a = ["dog", "bites", "man"];
  const b = ["man", "bites", "dog"];
  const sig = (words: string[]) =>
    words
      .map((w, i) => (withPos ? `${w}@${i}` : w))
      .sort()
      .join(" ");
  const same = sig(a) === sig(b);
  return (
    <Panel title="Word order: who bit whom?">
      <Toggle label="Add position information" checked={withPos} onChange={setWithPos} />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {[a, b].map((s) => (
          <div key={s.join(" ")} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <p className="text-sm font-medium text-slate-100">“{s.join(" ")}”</p>
            <p className="mt-1 text-xs text-slate-400">What attention sees (a set, so order is lost):</p>
            <p className="mt-1 font-mono text-xs text-violet-200">{"{ " + sig(s).split(" ").join(", ") + " }"}</p>
          </div>
        ))}
      </div>
      <p role="status" className={`mt-3 text-sm ${same ? "text-rose-300" : "text-emerald-300"}`}>
        {same ? "Identical: without positions the model can't tell who bit whom." : "Different: each token now carries where it sits, so the meanings can differ."}
      </p>
      {withPos && (
        <table className="mt-3 w-full text-left font-mono text-xs">
          <caption className="mb-1 text-left font-sans text-xs text-slate-400">The sinusoidal position signal added to each token (first {D_POS} dimensions)</caption>
          <tbody>
            {[0, 1, 2].map((p) => (
              <tr key={p} className="border-t border-slate-800">
                <td className="py-1 pr-2 text-slate-500">pos {p}</td>
                {sinusoid(p).map((v, i) => (
                  <td key={i} className="py-1 pr-1 text-slate-200">
                    {v.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ attention by hand */

export const TOY_TOKENS = ["the", "cat", "sat"];
export const TOY_X = [
  [1, 0, 0, 0],
  [0, 1, 0.5, 0],
  [0, 0, 1, 0.5],
];

export function attentionRow(X: number[][], row: number, opts: { causal: boolean; scale: boolean }) {
  const d = X[0]!.length;
  const scores = X.map((k, j) => (opts.causal && j > row ? -Infinity : X[row]!.reduce((s, q, i) => s + q * k[i]!, 0) / (opts.scale ? Math.sqrt(d) : 1)));
  const m = Math.max(...scores);
  const e = scores.map((s) => (s === -Infinity ? 0 : Math.exp(s - m)));
  const z = e.reduce((a, b) => a + b, 0);
  const weights = e.map((x) => x / z);
  const mixed = X[0]!.map((_, i) => X.reduce((s, v, j) => s + weights[j]! * v[i]!, 0));
  return { scores, weights, mixed };
}

/** Lab: attention on the worked example's toy vectors, with the mask and the √d scaling switchable. */
export function AttentionLab() {
  const [row, setRow] = useState(2);
  const [causal, setCausal] = useState(true);
  const [scale, setScale] = useState(true);
  const { scores, weights, mixed } = attentionRow(TOY_X, row, { causal, scale });
  return (
    <Panel title="Attention by hand (toy vectors from the worked example)">
      <div role="group" aria-label="Token doing the looking" className="flex gap-1.5">
        {TOY_TOKENS.map((t, i) => (
          <button
            key={t}
            type="button"
            aria-pressed={i === row}
            onClick={() => setRow(i)}
            className={`rounded-full border px-3 py-0.5 font-mono text-sm ${i === row ? "border-violet-500 bg-violet-500/15 text-violet-200" : "border-slate-700 text-slate-400"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Toggle label="Causal mask (no peeking ahead)" checked={causal} onChange={setCausal} />
        <Toggle label="Divide scores by √d" checked={scale} onChange={setScale} />
      </div>
      <table className="mt-3 w-full text-left text-sm">
        <caption className="sr-only">Scores and weights</caption>
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="py-1 font-medium">looks at</th>
            <th className="py-1 font-medium">score (q·k{scale ? " / √4" : ""})</th>
            <th className="py-1 font-medium">weight (softmax)</th>
          </tr>
        </thead>
        <tbody>
          {TOY_TOKENS.map((t, j) => (
            <tr key={t} className="border-t border-slate-800">
              <td className="py-1 font-mono text-slate-100">{t}</td>
              <td className="py-1 font-mono text-slate-300">{num(scores[j]!)}</td>
              <td className="py-1 font-mono text-violet-300">{num(weights[j]!)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p role="status" className="mt-3 text-sm text-slate-300">
        New vector for <span className="font-mono">{TOY_TOKENS[row]}</span>: <span className="font-mono text-emerald-300">[{mixed.map((v) => num(v)).join(", ")}]</span>
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Toy 4-number vectors chosen by hand so you can check every value; real models learn them, and use separate query, key and value matrices.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ norm, residual, feed-forward */

export function layerNorm(x: number[]) {
  const mean = x.reduce((a, b) => a + b, 0) / x.length;
  const v = x.reduce((a, b) => a + (b - mean) ** 2, 0) / x.length;
  return x.map((y) => (y - mean) / Math.sqrt(v + 1e-5));
}
export function rmsNorm(x: number[]) {
  const r = Math.sqrt(x.reduce((a, b) => a + b * b, 0) / x.length + 1e-5);
  return x.map((y) => y / r);
}

/** Lab: what normalisation does to a vector, and what a residual connection keeps. */
export function NormResidualLab() {
  const [x, setX] = useState([3, -1, 0.5, 8]);
  const [scaleUp, setScaleUp] = useState(1);
  const input = x.map((v) => v * scaleUp);
  const change = [0.241, 0.309, 0.605, 0.225]; // the worked example's attention output for "sat"
  const rows: [string, number[]][] = [
    ["input", input],
    ["LayerNorm (GPT-2)", layerNorm(input)],
    ["RMSNorm (Llama)", rmsNorm(input)],
    ["input + change (residual)", input.map((v, i) => v + change[i]!)],
  ];
  return (
    <Panel title="Normalisation and residual connections">
      <div className="grid gap-2 sm:grid-cols-2">
        {x.map((v, i) => (
          <Slider key={i} label={`x${i + 1}`} min={-10} max={10} step={0.5} value={v} onChange={(n) => setX((o) => o.map((w, j) => (j === i ? n : w)))} />
        ))}
      </div>
      <div className="mt-2">
        <Slider label="Multiply the whole vector by" min={1} max={100} step={1} value={scaleUp} onChange={setScaleUp} format={(v) => `×${v}`} hint="Watch which rows change and which don't." />
      </div>
      <table className="mt-3 w-full text-left font-mono text-xs">
        <caption className="sr-only">Vectors</caption>
        <tbody>
          {rows.map(([name, v]) => (
            <tr key={name} className="border-t border-slate-800">
              <th scope="row" className="py-1 pr-2 text-left font-sans font-medium text-slate-400">
                {name}
              </th>
              {v.map((n, i) => (
                <td key={i} className="py-1 pr-1 text-slate-100">
                  {num(n, 2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-slate-500">The &ldquo;change&rdquo; is the worked example&apos;s attention output for sat. Everything here is computed in your browser.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ logits → probabilities (real gemma4) */

/** Lab: gemma4's real scores for the next token; shifting all scores changes nothing, scaling them does. */
export function LogitsLab({ load }: { load?: () => Promise<GenRecording> }) {
  const { rec, failed } = useGenRecording(load);
  const [shift, setShift] = useState(0);
  const [scale, setScale] = useState(1);
  const tree = rec?.trees[0];
  const node = tree ? nodeAt(tree, ["small"]) : null;
  const base = useMemo(() => (tree && node !== null ? choicesAt(tree, node, 1).slice(0, 6) : []), [tree, node]);
  if (!rec) return <Panel title="Logits → probabilities"><p role="status" className="text-sm text-slate-400">{failed ? "Couldn't load the recording." : "Loading real gemma4 scores…"}</p></Panel>;
  const logits = base.map((c) => (Math.log(c.raw) + shift) * scale);
  const m = Math.max(...logits);
  const e = logits.map((l) => Math.exp(l - m));
  const z = e.reduce((a, b) => a + b, 0);
  return (
    <Panel title="Logits → probabilities (gemma4, after “…there was a small”)">
      <div className="grid gap-2 sm:grid-cols-2">
        <Slider label="Add to every score" min={-5} max={5} step={0.5} value={shift} onChange={setShift} format={(v) => (v >= 0 ? `+${v}` : String(v))} />
        <Slider label="Multiply every score" min={0.2} max={3} step={0.1} value={scale} onChange={setScale} format={(v) => `×${v.toFixed(1)}`} />
      </div>
      <table className="mt-3 w-full text-left text-sm">
        <caption className="sr-only">Scores</caption>
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="py-1 font-medium">token</th>
            <th className="py-1 font-medium">score (logit)</th>
          </tr>
        </thead>
        <tbody>
          {base.map((c, i) => (
            <tr key={c.token} className="border-t border-slate-800">
              <td className="py-1 font-mono text-slate-100">{showToken(c.token)}</td>
              <td className="py-1 font-mono text-slate-300">{num(logits[i]!, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3">
        <ProbBars label="Softmax of the scores (top six, renormalised)" items={base.map((c, i) => ({ label: showToken(c.token), value: e[i]! / z }))} format={pct} />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        GPT-2 produces {GPT2.vocab.toLocaleString("en-US")} scores per step, one per vocabulary token; this shows gemma4&apos;s top six.
      </p>
      <RecordedNote rec={rec} />
    </Panel>
  );
}
