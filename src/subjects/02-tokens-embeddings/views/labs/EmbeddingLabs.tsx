/** Concept labs for Module 02, steps 11–14 (embedding table, contextual vectors, sentence vectors, search). */
import { useState } from "react";
import { Panel, Segmented, Slider, Toggle } from "../../../../components/ui";
import labs from "../../data/embedding-labs.json";
import minilm from "../../deep/data/minilm.json";
import { encodeWordPiece } from "../../wordpiece";
import { VocabStatus, useBertVocab } from "../WordPieceView";
import { TextBox, formatInt } from "../common";

const dot = (a: ArrayLike<number>, b: ArrayLike<number>) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i]! * b[i]!;
  return s;
};
const norm = (a: ArrayLike<number>) => Math.sqrt(dot(a, a));
const cos = (a: ArrayLike<number>, b: ArrayLike<number>) => dot(a, b) / (norm(a) * norm(b));
const mean = (rows: number[][]) => rows[0]!.map((_, k) => rows.reduce((s, r) => s + r[k]!, 0) / rows.length);
const f3 = (x: number) => x.toFixed(3);

/** First n numbers of a vector as a colour strip (blue positive, rose negative). */
function Strip({ v, n = 32, scale = 0.3 }: { v: ArrayLike<number>; n?: number; scale?: number }) {
  return (
    <div className="flex h-4 flex-1 overflow-hidden rounded" aria-hidden>
      {Array.from({ length: Math.min(n, v.length) }, (_, i) => {
        const x = v[i]!;
        const a = Math.min(1, Math.abs(x) / scale);
        return <span key={i} className="flex-1" style={{ backgroundColor: x >= 0 ? `rgba(56,189,248,${a})` : `rgba(244,63,94,${a})` }} />;
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ step 11: sparse gradient */

/** Lab: which rows of BERT's 30,522-row table one sentence touches, and how repeated tokens add up. */
export function SparseGradLab() {
  const state = useBertVocab();
  const [text, setText] = useState("The bank approved the loan");
  const [addAt, setAddAt] = useState(true);
  const v = state.vocab;
  const ids = v ? [101, ...encodeWordPiece(text, v).tokens.map((t) => t.id), 102] : [];
  const rows = new Map<number, number>();
  for (const id of ids) rows.set(id, (rows.get(id) ?? 0) + 1);
  const repeated = [...rows].filter(([, c]) => c > 1);
  const V = v?.tokens.length ?? 30522;
  return (
    <Panel title="Which rows does one sentence train?">
      <TextBox label="Sentence" value={text} onChange={setText} rows={1} maxLength={200} />
      <Toggle label="Accumulate repeats (np.add.at)" checked={addAt} onChange={setAddAt} description="Off: the buggy G[ids] += g, which keeps only one update per row." />
      {v ? (
        <>
          <table className="mt-3 w-full text-left text-sm">
            <caption className="sr-only">Rows that receive a gradient</caption>
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="font-normal">row (token)</th>
                <th className="font-normal">positions</th>
                <th className="font-normal">gradient received (toy: 1 per position)</th>
              </tr>
            </thead>
            <tbody>
              {[...rows].map(([id, c]) => (
                <tr key={id} className="border-t border-slate-800">
                  <td className="py-1 font-mono text-slate-100">
                    {formatInt(id)} <span className="text-slate-400">({v.tokens[id]})</span>
                  </td>
                  <td className="py-1 font-mono text-slate-300">{c}</td>
                  <td className={`py-1 font-mono ${c > 1 && !addAt ? "text-rose-300" : "text-emerald-200"}`}>{addAt ? c : 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p role="status" className="mt-2 text-sm text-slate-200">
            {ids.length} positions touch {rows.size} of {formatInt(V)} rows ({((100 * rows.size) / V).toFixed(3)}%); the other {formatInt(V - rows.size)} get no gradient.
            {repeated.length > 0 &&
              ` Row ${formatInt(repeated[0]![0])} (${v.tokens[repeated[0]![0]]}) appears ${repeated[0]![1]} times: ${addAt ? `its updates add up to ${repeated[0]![1]}` : "the naive update keeps only 1, losing the rest"}.`}
          </p>
        </>
      ) : (
        <div className="mt-2">
          <VocabStatus state={state} />
        </div>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 11: table memory */

const TABLES = [
  { name: "MiniLM", V: 30522, d: 384 },
  { name: "GPT-2 small", V: 50257, d: 768 },
  { name: "Llama 3 8B", V: 128256, d: 4096 },
  { name: "GPT-3 175B", V: 50257, d: 12288 },
] as const;
type Precision = "4" | "2" | "1";

/** Lab: embedding-table memory from vocabulary size, width and precision (published model configurations). */
export function TableMemoryLab() {
  const [V, setV] = useState(30522);
  const [d, setD] = useState(384);
  const [bytes, setBytes] = useState<Precision>("4");
  const numbers = V * d;
  const mb = (numbers * Number(bytes)) / 1e6;
  const preset = TABLES.find((t) => t.V === V && t.d === d);
  return (
    <Panel title="How much memory does the table take?">
      <div className="flex flex-wrap gap-1.5">
        {TABLES.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => {
              setV(t.V);
              setD(t.d);
            }}
            className={`rounded-full border px-2.5 py-1 text-xs ${preset?.name === t.name ? "border-sky-400 text-sky-100" : "border-slate-700 text-slate-300"}`}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Slider label="Vocabulary (rows)" min={1000} max={256000} step={1} value={V} onChange={setV} format={formatInt} />
        <Slider label="Width d_model (columns)" min={64} max={12288} step={64} value={d} onChange={setD} format={formatInt} />
      </div>
      <div className="mt-2">
        <Segmented<Precision>
          label="Precision"
          value={bytes}
          options={[
            { value: "4", label: "float32 (4 bytes)" },
            { value: "2", label: "float16 (2 bytes)" },
            { value: "1", label: "int8 (1 byte)" },
          ]}
          onChange={setBytes}
        />
      </div>
      <p role="status" className="mt-3 text-sm text-slate-100">
        {preset ? `${preset.name}: ` : ""}
        {formatInt(V)} × {formatInt(d)} = {formatInt(numbers)} numbers = {mb.toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} MB
      </p>
      <p className="mt-1 text-xs text-slate-400">A direct lookup reads {formatInt(d)} numbers; the one-hot product would do {formatInt(numbers)} multiply-adds for the same row.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 12: cosine baseline */

const BANK = minilm.bank as Record<string, number[]>;
const BANK_NAMES = Object.keys(BANK);
const BANK_SENSE = ["money", "money", "river", "river"];
const POOL = minilm.pool as Record<string, { tokens: string[]; vectors: number[][]; sentence: number[] }>;

/** Lab: real `bank` cosines against a baseline, and a threshold that tries to separate the senses. */
export function CosBaselineLab() {
  const [t, setT] = useState(0.8);
  const pairs: { a: number; b: number; c: number; same: boolean }[] = [];
  for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) pairs.push({ a, b, c: cos(BANK[BANK_NAMES[a]!]!, BANK[BANK_NAMES[b]!]!), same: BANK_SENSE[a] === BANK_SENSE[b] });
  const A = POOL["The bank approved the loan"]!;
  const B = POOL["I forgot my login details"]!;
  const cross: number[] = [];
  for (let i = 1; i < A.tokens.length - 1; i++) for (let j = 1; j < B.tokens.length - 1; j++) cross.push(cos(A.vectors[i]!, B.vectors[j]!));
  const baseline = cross.reduce((s, x) => s + x, 0) / cross.length;
  const right = pairs.filter((p) => p.c >= t === p.same).length;
  return (
    <Panel title="What does a cosine of 0.8 mean? (real MiniLM vectors)">
      <p className="text-xs text-slate-400">
        Baseline: {cross.length} pairs of different words from two unrelated sentences average <span className="font-mono text-slate-200">{f3(baseline)}</span>.
      </p>
      <Slider label="Call it the same sense when cosine ≥" min={0.7} max={0.95} step={0.005} value={t} onChange={setT} format={f3} />
      <ol className="mt-2 space-y-1 text-sm">
        {pairs.map((p) => {
          const ok = p.c >= t === p.same;
          return (
            <li key={`${p.a}-${p.b}`} className={`rounded-lg border px-2 py-1 ${ok ? "border-emerald-500/40" : "border-rose-500/50"}`}>
              <span className="font-mono text-sky-200">{f3(p.c)}</span> {BANK_NAMES[p.a]} · {BANK_NAMES[p.b]}{" "}
              <span className="text-xs text-slate-400">({p.same ? "same sense" : "different senses"}) {ok ? "✓" : "✗"}</span>
            </li>
          );
        })}
      </ol>
      <p role="status" className="mt-2 text-sm text-slate-100">
        Threshold {f3(t)}: {right} of {pairs.length} pairs judged correctly.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 13: padding mask */

const PAD = labs.padded;
const REAL = PAD.mask.filter(Boolean).length;

/** Lab: pool a padded batch row with and without the mask (real MiniLM outputs at every position). */
export function PoolMaskLab() {
  const [len, setLen] = useState(PAD.tokens.length);
  const [poolMask, setPoolMask] = useState(true);
  const [modelMask, setModelMask] = useState(true);
  const rows = (modelMask ? PAD.withMask : PAD.noMask).slice(0, len);
  const used = poolMask ? rows.slice(0, REAL) : rows;
  const c = cos(mean(used), PAD.alone);
  return (
    <Panel title="Padding in a batch (real MiniLM outputs)">
      <p className="text-xs text-slate-400">
        “{PAD.short}” batched with a longer sentence, so it is padded to the batch length.
      </p>
      <Slider label="Batch length (tokens)" min={REAL} max={PAD.tokens.length} step={1} value={len} onChange={setLen} />
      <div className="mt-1 flex flex-wrap gap-1">
        {PAD.tokens.slice(0, len).map((tok, i) => (
          <span key={i} className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${PAD.mask[i] ? "bg-sky-500/20 text-sky-100" : poolMask ? "bg-slate-800 text-slate-500 line-through" : "bg-amber-500/25 text-amber-100"}`}>
            {tok} <sub>{PAD.mask[i]}</sub>
          </span>
        ))}
      </div>
      <div className="mt-2 grid gap-1">
        <Toggle label="Mask padding when averaging" checked={poolMask} onChange={setPoolMask} />
        <Toggle label="Give the model the attention mask" checked={modelMask} onChange={setModelMask} description="Off: the model also attends to the padding." />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        Averaging {used.length} rows: cosine with the sentence embedded on its own = {f3(c)}.
      </p>
      <p className="mt-1 text-xs text-slate-400">With both masks the result is 0.992 rather than exactly 1: the quantized model&apos;s numbers shift slightly inside a padded batch.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 13: score traps */

const TRAPS = labs.traps;

/** Lab: predict, then reveal, real MiniLM scores for pairs where similarity misleads. */
export function ScoreTrapsLab() {
  const [shown, setShown] = useState<Set<number>>(new Set());
  const V = TRAPS.vectors as Record<string, number[]>;
  return (
    <Panel title="Predict the score, then reveal it (real MiniLM)">
      <ol className="space-y-1.5 text-sm">
        {TRAPS.pairs.map((p, i) => (
          <li key={i} className="rounded-lg border border-slate-800 p-2">
            <div className="text-xs uppercase tracking-wide text-slate-500">{p.kind}</div>
            <div className="text-slate-200">
              “{p.a}” · “{p.b}”
            </div>
            {shown.has(i) ? (
              <div className="font-mono text-sky-200">{f3(dot(V[p.a]!, V[p.b]!))}</div>
            ) : (
              <button type="button" onClick={() => setShown(new Set(shown).add(i))} className="mt-1 rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300" aria-label={`Reveal: ${p.kind}`}>
                Reveal
              </button>
            )}
          </li>
        ))}
      </ol>
      <p role="status" className="mt-2 text-sm text-slate-300">
        {shown.size} of {TRAPS.pairs.length} revealed.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 14: pipeline trace */

const SEARCH = minilm.search;
const STAGES = ["word pieces", "IDs", "contextual vectors", "mean", "normalise", "search"] as const;

/** Lab: step one recorded sentence through the whole pipeline, with real numbers at every stage. */
export function PipelineTraceLab() {
  const names = Object.keys(POOL);
  const [name, setName] = useState(names[1]!);
  const [stage, setStage] = useState(0);
  const P = POOL[name]!;
  const m = mean(P.vectors);
  const n = norm(m);
  const unit = m.map((x) => x / n);
  const ranked = SEARCH.docs.map((d, i) => ({ d, s: dot(unit, SEARCH.doc_vectors[i]!) })).sort((a, b) => b.s - a.s);
  const summary = [
    `${P.tokens.length} pieces: ${P.tokens.join(" ")}`,
    `IDs: ${(minilm.pool as Record<string, { ids: number[] }>)[name]!.ids.join(", ")}`,
    `${P.vectors.length} vectors of ${P.vectors[0]!.length} numbers, one per piece`,
    `the average has length ${n.toFixed(3)}`,
    `length 1; cosine with MiniLM's own sentence vector ${f3(cos(unit, P.sentence))}`,
    `nearest help question: “${ranked[0]!.d}” (${f3(ranked[0]!.s)})`,
  ];
  return (
    <Panel title="Text → vector → search, one stage at a time">
      <Segmented label="Sentence" value={name} options={names.map((x) => ({ value: x, label: x }))} onChange={(x) => { setName(x); setStage(0); }} />
      <ol className="mt-3 flex flex-wrap gap-1 text-xs">
        {STAGES.map((s, i) => (
          <li key={s} className={`rounded-full border px-2 py-0.5 ${i === stage ? "border-sky-400 text-sky-100" : i < stage ? "border-emerald-600/60 text-emerald-200" : "border-slate-700 text-slate-500"}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>
      <div className="mt-3 space-y-1">
        {stage === 2 &&
          P.vectors.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-16 truncate text-right font-mono text-[11px] text-slate-400">{P.tokens[i]}</span>
              <Strip v={v} />
            </div>
          ))}
        {(stage === 3 || stage === 4) && (
          <div className="flex items-center gap-2">
            <span className="w-16 text-right text-[11px] text-sky-200">{stage === 3 ? "mean" : "unit"}</span>
            <Strip v={stage === 3 ? m : unit} scale={stage === 3 ? 0.3 : 0.1} />
          </div>
        )}
        {stage === 5 && (
          <ol className="space-y-0.5 text-sm">
            {ranked.slice(0, 3).map((r) => (
              <li key={r.d} className="flex justify-between gap-2 text-slate-200">
                <span>{r.d}</span>
                <span className="font-mono text-sky-200">{f3(r.s)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        Stage {stage + 1}, {STAGES[stage]}: {summary[stage]}
      </p>
      <div className="mt-2 flex gap-2">
        <button type="button" disabled={stage === 0} onClick={() => setStage(stage - 1)} className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 disabled:opacity-40">
          ← Back
        </button>
        <button type="button" disabled={stage === STAGES.length - 1} onClick={() => setStage(stage + 1)} className="rounded border border-sky-500 px-2 py-1 text-xs text-sky-100 disabled:opacity-40">
          Next stage →
        </button>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 14: index cost */

export function chunksPerDoc(tokens: number, size: number, overlap: number): number {
  if (tokens <= size) return 1;
  return Math.ceil((tokens - size) / (size - overlap)) + 1;
}

/** Lab: what an index costs: chunks, stored bytes and work per query (computed). */
export function IndexCostLab() {
  const [docs, setDocs] = useState<"10000" | "100000" | "1000000" | "10000000">("100000");
  const [tokens, setTokens] = useState(1000);
  const [size, setSize] = useState(200);
  const [overlap, setOverlap] = useState(50);
  const [d, setD] = useState<"384" | "768" | "1536">("384");
  const ov = Math.min(overlap, size - 1);
  const chunks = Number(docs) * chunksPerDoc(tokens, size, ov);
  const gb = (chunks * Number(d) * 4) / 1e9;
  return (
    <Panel title="What does an index cost?">
      <Segmented
        label="Documents"
        value={docs}
        options={[
          { value: "10000", label: "10k" },
          { value: "100000", label: "100k" },
          { value: "1000000", label: "1M" },
          { value: "10000000", label: "10M" },
        ]}
        onChange={setDocs}
      />
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <Slider label="Tokens per document" min={50} max={20000} step={50} value={tokens} onChange={setTokens} format={formatInt} />
        <Slider label="Chunk size" min={50} max={512} step={1} value={size} onChange={setSize} />
        <Slider label="Overlap" min={0} max={256} step={1} value={ov} onChange={setOverlap} />
      </div>
      <div className="mt-2">
        <Segmented
          label="Vector width"
          value={d}
          options={[
            { value: "384", label: "384 (MiniLM)" },
            { value: "768", label: "768" },
            { value: "1536", label: "1,536" },
          ]}
          onChange={setD}
        />
      </div>
      <p role="status" className="mt-3 text-sm text-slate-100">
        {formatInt(chunks)} chunks to embed once; {gb.toFixed(2)} GB of float32 vectors; a full scan does {formatInt(chunks * Number(d))} multiply-adds per query.
      </p>
      <p className="mt-1 text-xs text-slate-400">Indexing runs the model once per chunk; each query runs it once, plus the scan. Vector databases avoid the full scan with approximate indexes (Module 09).</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 14: retrieval evaluation */

const words = (t: string) => new Set(t.toLowerCase().match(/[a-z0-9']+/g) ?? []);
export function jaccard(a: string, b: string): number {
  const A = words(a);
  const B = words(b);
  let i = 0;
  for (const w of A) if (B.has(w)) i++;
  return i / (A.size + B.size - i);
}
/** Indices sorted by score, highest first; ties keep document order (as Python's stable sort does). */
const order = (scores: number[]) => scores.map((s, i) => ({ s, i })).sort((a, b) => b.s - a.s).map((x) => x.i);

/** Lab: hit@k and MRR on six labelled real queries, for embeddings or keyword overlap. */
export function RetrievalEvalLab() {
  const [method, setMethod] = useState<"emb" | "kw">("emb");
  const [k, setK] = useState(1);
  const [lenient, setLenient] = useState(false);
  const ranks = SEARCH.queries.map((q, qi) => {
    const scores = SEARCH.docs.map((d, j) => (method === "emb" ? dot(SEARCH.query_vectors[qi]!, SEARCH.doc_vectors[j]!) : jaccard(q, d)));
    const o = order(scores);
    const gold = lenient && qi === 0 ? [SEARCH.answers[qi]!, 0] : [SEARCH.answers[qi]!];
    return { q, top: SEARCH.docs[o[0]!]!, rank: Math.min(...gold.map((g) => o.indexOf(g) + 1)) };
  });
  const hit = ranks.filter((r) => r.rank <= k).length / ranks.length;
  const mrr = ranks.reduce((s, r) => s + 1 / r.rank, 0) / ranks.length;
  return (
    <Panel title="Measure the search (6 labelled real queries)">
      <Segmented
        label="Method"
        value={method}
        options={[
          { value: "emb", label: "MiniLM embeddings" },
          { value: "kw", label: "Keyword overlap" },
        ]}
        onChange={setMethod}
      />
      <Slider label="k" min={1} max={5} step={1} value={k} onChange={setK} />
      <Toggle label="Also accept “How do I reset my password?” for the sign-in query" checked={lenient} onChange={setLenient} />
      <ol className="mt-2 space-y-1 text-sm">
        {ranks.map((r) => (
          <li key={r.q} className={`rounded-lg border px-2 py-1 ${r.rank <= k ? "border-emerald-500/40" : "border-rose-500/50"}`}>
            <span className="text-slate-200">{r.q}</span> <span className="text-xs text-slate-400">→ top: {r.top}</span>{" "}
            <span className="font-mono text-xs text-sky-200">rank {r.rank}</span>
          </li>
        ))}
      </ol>
      <p role="status" className="mt-2 text-sm text-slate-100">
        hit@{k} = {f3(hit)}, MRR = {f3(mrr)}
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 14: hybrid */

const HY = labs.hybrid;

/** Lab: blend keyword overlap and embedding scores, on error-code queries and the banking set at once. */
export function HybridLab() {
  const [alpha, setAlpha] = useState(0);
  const run = (S: { docs: string[]; queries: string[]; query_vectors: number[][]; doc_vectors: number[][]; answers: number[] }) =>
    S.queries.map((q, qi) => {
      const sc = S.docs.map((d, j) => alpha * jaccard(q, d) + (1 - alpha) * dot(S.query_vectors[qi]!, S.doc_vectors[j]!));
      const top = order(sc)[0]!;
      return { q, top: S.docs[top]!, ok: top === S.answers[qi] };
    });
  const codes = run(HY);
  const bank = run(SEARCH);
  const n = (r: { ok: boolean }[]) => r.filter((x) => x.ok).length;
  return (
    <Panel title="Hybrid search: keywords + embeddings (real MiniLM)">
      <Slider label="Keyword weight α (score = α·keyword + (1−α)·embedding)" min={0} max={1} step={0.05} value={alpha} onChange={setAlpha} format={(x) => x.toFixed(2)} />
      <h4 className="mt-2 text-xs uppercase tracking-wide text-slate-500">Error-code help pages</h4>
      <ol className="space-y-1 text-sm">
        {codes.map((r) => (
          <li key={r.q} className={`rounded-lg border px-2 py-1 ${r.ok ? "border-emerald-500/40" : "border-rose-500/50"}`}>
            <span className="text-slate-200">{r.q}</span> <span className="text-xs text-slate-400">→ {r.top}</span> {r.ok ? "✓" : "✗"}
          </li>
        ))}
      </ol>
      <p role="status" className="mt-2 text-sm text-slate-100">
        α = {alpha.toFixed(2)}: error codes {n(codes)}/{codes.length} right at rank 1; paraphrased banking queries {n(bank)}/{bank.length}.
      </p>
      <p className="mt-1 text-xs text-slate-400">Keyword overlap scores are small (around 0.1), so they need a large weight to matter, and too much weight drowns the embeddings. Real systems normalise both scores or fuse ranks.</p>
    </Panel>
  );
}
