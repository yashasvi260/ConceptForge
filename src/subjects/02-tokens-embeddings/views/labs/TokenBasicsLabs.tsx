/** Concept labs for Module 02, steps 1–2 (why tokens; the vocabulary). Real token counts from deep/data. */
import { useState } from "react";
import { Panel, Segmented, Slider, Toggle } from "../../../../components/ui";
import { MODEL_CONFIGS, fmt, paramBreakdown } from "../../../01-intro-llms/modelConfigs";
import { ProbBars } from "../../../01-intro-llms/views/labkit";
import tokens from "../../deep/data/tokens.json";
import { useRealTokenizer } from "../../useRealTokenizer";

const LANGS = tokens.languages;
const area = "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 font-mono text-sm text-slate-100";

/* ------------------------------------------------------------------ unknown tokens per scheme */

type Scheme = "words" | "chars" | "bytes";
const split: Record<Scheme, (t: string) => (string | number)[]> = {
  words: (t) => t.split(/\s+/).filter(Boolean),
  chars: (t) => Array.from(t),
  bytes: (t) => Array.from(new TextEncoder().encode(t)),
};

/** Lab: build a vocabulary from one text, then see which tokens of a new text it doesn't know. */
export function OovLab() {
  const [train, setTrain] = useState("the cat sat on the mat the dog sat on the log");
  const [test, setTest] = useState("the cats sat on the rug 🤖");
  const [scheme, setScheme] = useState<Scheme>("words");
  const vocab = scheme === "bytes" ? null : new Set(split[scheme](train));
  const toks = split[scheme](test);
  const unknown = toks.filter((t) => vocab !== null && !vocab.has(t as string));
  return (
    <Panel title="Which tokens does the vocabulary not know?">
      <label className="block text-xs text-slate-400">
        Training text (builds the vocabulary)
        <input value={train} onChange={(e) => setTrain(e.target.value)} className={area} />
      </label>
      <label className="mt-2 block text-xs text-slate-400">
        New text
        <input value={test} onChange={(e) => setTest(e.target.value)} className={area} />
      </label>
      <div className="mt-3">
        <Segmented<Scheme> label="Cut into" value={scheme} options={[{ value: "words", label: "Words" }, { value: "chars", label: "Characters" }, { value: "bytes", label: "Bytes" }]} onChange={setScheme} />
      </div>
      <p className="mt-3 flex flex-wrap gap-1">
        {toks.slice(0, 60).map((t, i) => {
          const bad = vocab !== null && !vocab.has(t as string);
          return (
            <span key={i} className={`rounded border px-1 font-mono text-xs ${bad ? "border-rose-500/60 bg-rose-500/10 text-rose-200" : "border-slate-700 text-slate-300"}`}>
              {String(t) === " " ? "␣" : String(t)}
            </span>
          );
        })}
      </p>
      <p role="status" className="mt-2 text-sm text-slate-200">
        {toks.length} tokens, {unknown.length} unknown ({toks.length ? ((100 * unknown.length) / toks.length).toFixed(0) : 0}%){scheme === "bytes" ? " — all 256 byte values are always in the vocabulary." : ""}
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ sequence length by scheme */

/** Lab: one sentence measured as words, characters, UTF-8 bytes and real GPT-4o tokens. */
export function SeqLengthLab() {
  const [lang, setLang] = useState(0);
  const [own, setOwn] = useState("Tokenization decides how long every text is.");
  const row = LANGS[lang]!;
  const live = useRealTokenizer("o200k_base", own);
  const measure = (words: number, chars: number, bytes: number, toks: number) => [
    { label: "words (spaces)", value: words },
    { label: "characters", value: chars },
    { label: "UTF-8 bytes", value: bytes },
    { label: "GPT-4o tokens", value: toks, highlight: true },
  ];
  const sample = measure(row.text.split(/\s+/).filter(Boolean).length, row.chars, row.utf8_bytes, row.o200k_base);
  const max = Math.max(...sample.map((s) => s.value));
  const ownBars = measure(own.split(/\s+/).filter(Boolean).length, Array.from(own).length, new TextEncoder().encode(own).length, live.tokens.length);
  const ownMax = Math.max(1, ...ownBars.map((s) => s.value));
  return (
    <Panel title="How long is one sentence?">
      <div role="group" aria-label="Sample" className="flex flex-wrap gap-1.5">
        {LANGS.map((l, i) => (
          <button key={l.label} type="button" aria-pressed={i === lang} onClick={() => setLang(i)} className={`rounded-full border px-2.5 py-0.5 text-xs ${i === lang ? "border-violet-500 bg-violet-500/15 text-violet-200" : "border-slate-700 text-slate-400"}`}>
            {l.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-slate-200">{row.text}</p>
      <div className="mt-2">
        <ProbBars label="Length of the sample" format={(v) => String(Math.round(v * max))} items={sample.map((s) => ({ ...s, value: s.value / max }))} />
      </div>
      <label className="mt-4 block text-xs text-slate-400">
        Your own text
        <input value={own} onChange={(e) => setOwn(e.target.value)} className={area} />
      </label>
      <div className="mt-2">
        <ProbBars label="Length of your text" format={(v) => String(Math.round(v * ownMax))} items={ownBars.map((s) => ({ ...s, value: s.value / ownMax }))} />
      </div>
      <p role="status" className="mt-1 text-[11px] text-slate-500">{live.status === "ready" ? "GPT-4o counts from its real tokenizer, running in your browser." : "Loading GPT-4o's real tokenizer…"}</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ what a vocabulary costs */

/** Lab: rows × width × tables, as a share of a real model. */
export function VocabCostLab() {
  const [id, setId] = useState(MODEL_CONFIGS[0]!.id);
  const base = MODEL_CONFIGS.find((m) => m.id === id)!;
  const [v, setV] = useState(base.vocab);
  const [tied, setTied] = useState(base.tiedEmbeddings);
  const cfg = { ...base, vocab: v, tiedEmbeddings: tied };
  const p = paramBreakdown(cfg);
  const tables = v * cfg.dModel * (tied ? 1 : 2);
  return (
    <Panel title="What a bigger vocabulary costs">
      <Segmented
        label="Model"
        value={id}
        options={MODEL_CONFIGS.map((m) => ({ value: m.id, label: m.name }))}
        onChange={(x) => {
          const m = MODEL_CONFIGS.find((c) => c.id === x)!;
          setId(x);
          setV(m.vocab);
          setTied(m.tiedEmbeddings);
        }}
      />
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Slider label="Vocabulary size" min={1000} max={262144} step={1} value={v} onChange={setV} format={fmt} />
        <Toggle label="Tied: the output head reuses the table" checked={tied} onChange={setTied} />
      </div>
      <p role="status" className="mt-3 text-sm text-slate-200">
        Vocabulary tables: {fmt(v)} × {fmt(cfg.dModel)} × {tied ? 1 : 2} = <span className="font-mono text-violet-300">{fmt(tables)}</span> parameters, {((100 * tables) / p.total).toFixed(1)}% of a {fmt(p.total)}-parameter model.
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Exact counts from the published configurations (Module 01&apos;s parameter calculator).</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ what a bigger vocabulary buys */

/** Lab: real GPT-4 (≈100k) vs GPT-4o (≈200k) token counts for each sample. */
export function VocabBuysLab() {
  const rows = LANGS.map((l) => ({ l, saved: (l.cl100k_base - l.o200k_base) / l.cl100k_base }));
  const best = rows.reduce((a, b) => (b.saved > a.saved ? b : a));
  return (
    <Panel title={`What doubling the vocabulary buys (${fmt(tokens.vocab_sizes.cl100k_base)} → ${fmt(tokens.vocab_sizes.o200k_base)})`}>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Tokens per tokenizer</caption>
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="py-1 font-medium">sample</th>
            <th className="py-1 font-medium">GPT-4</th>
            <th className="py-1 font-medium">GPT-4o</th>
            <th className="py-1 font-medium">saved</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ l, saved }) => (
            <tr key={l.label} className="border-t border-slate-800">
              <td className="py-1 text-slate-200">{l.label}</td>
              <td className="py-1 font-mono text-slate-300">{l.cl100k_base}</td>
              <td className="py-1 font-mono text-slate-300">{l.o200k_base}</td>
              <td className="py-1 font-mono text-violet-300">{(100 * saved).toFixed(0)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p role="status" className="mt-2 text-sm text-slate-200">
        Biggest win: {best.l.label} ({(100 * best.saved).toFixed(0)}% fewer tokens). Some texts don&apos;t gain at all.
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Real counts from OpenAI&apos;s tiktoken vocabularies.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ adding tokens when fine-tuning */

/** Lab: the extra parameters from adding new tokens (one new row per token, per table). */
export function AddTokensLab() {
  const [id, setId] = useState(MODEL_CONFIGS[1]!.id);
  const [n, setN] = useState(20);
  const m = MODEL_CONFIGS.find((x) => x.id === id)!;
  const tables = m.tiedEmbeddings ? 1 : 2;
  const added = n * m.dModel * tables;
  return (
    <Panel title="Adding your own tokens when fine-tuning">
      <Segmented label="Model" value={id} options={MODEL_CONFIGS.map((x) => ({ value: x.id, label: x.name }))} onChange={setId} />
      <div className="mt-3">
        <Slider label="New tokens (domain terms, special tokens)" min={1} max={2000} step={1} value={n} onChange={setN} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        {n} new rows × {fmt(m.dModel)} numbers × {tables} table{tables > 1 ? "s" : ""} = <span className="font-mono text-violet-300">{fmt(added)}</span> new parameters, all starting untrained.
      </p>
      <p className="mt-1 text-xs text-slate-400">The vocabulary grows from {fmt(m.vocab)} to {fmt(m.vocab + n)}. Each new row needs enough training examples to become useful; starting it at the average of existing rows avoids nonsense outputs at first.</p>
    </Panel>
  );
}
