import { Search, Table2 } from "lucide-react";
import { useState } from "react";
import { Panel, Stat } from "../../../components/ui";
import { MAX_SENTENCES } from "../../../ml/embeddings";
import { LongInputNote, ModelRunError, ModelStatus } from "../../../ml/ModelStatus";
import { useEmbeddings } from "../../../ml/useEmbeddings";
import { useModelRun } from "../../../ml/useModelRun";
import { cosine, meanPool } from "../../../ml/vector";
import { findWord } from "../bank";
import { encodeWordPiece } from "../wordpiece";
import { TextBox, TokenChip, formatInt } from "./common";
import { VocabStatus, useBertVocab } from "./WordPieceView";

/** Small heat strip for a vector (first `n` numbers). */
function Strip({ v, n = 48 }: { v: ArrayLike<number>; n?: number }) {
  const max = Math.max(...Array.from({ length: Math.min(n, v.length) }, (_, i) => Math.abs(v[i]!)), 1e-9);
  return (
    <span className="flex gap-px" aria-hidden>
      {Array.from({ length: Math.min(n, v.length) }, (_, i) => {
        const x = v[i]! / max;
        return <span key={i} className="h-4 w-1.5 rounded-[1px]" style={{ backgroundColor: x >= 0 ? `rgba(56,189,248,${0.15 + 0.85 * x})` : `rgba(251,113,133,${0.15 - 0.85 * x})` }} />;
      })}
    </span>
  );
}

function pseudoRow(id: number, n = 48): number[] {
  // Illustrative values only: the real table lives inside the model file.
  let h = id * 2654435761;
  return Array.from({ length: n }, () => {
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
    return (h / 0xffffffff) * 2 - 1;
  });
}

export function LookupView() {
  const [text, setText] = useState("The bank approved the loan");
  const bert = useBertVocab();
  const tokens = bert.vocab ? encodeWordPiece(text, bert.vocab).tokens.slice(0, 16) : [];
  return (
    <>
      <Panel title="Text → token IDs → rows of the embedding table" icon={<Table2 size={14} />}>
        <TextBox label="Sentence" value={text} onChange={setText} rows={1} maxLength={200} />
        {!bert.vocab ? (
          <div className="mt-3">
            <VocabStatus state={bert} />
          </div>
        ) : (
          <ul className="mt-4 space-y-1.5" data-testid="lookup-ids">
            {tokens.map((t, i) => (
              <li key={i} className="flex items-center gap-3">
                <TokenChip index={i} text={t.text} />
                <span className="w-24 font-mono text-xs text-slate-400">row {formatInt(t.id)}</span>
                <Strip v={pseudoRow(t.id)} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="The table itself">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Stat label="Shape (MiniLM)" value="30,522 × 384" sub="30,522 rows × 384 numbers" />
          <Stat label="Numbers in the table" value="≈ 11.7 million" />
          <Stat label="Same IDs as" value="BERT" sub="bert-base-uncased WordPiece vocabulary" />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          IDs are real (MiniLM uses BERT's vocabulary). The coloured strips are illustrative: the real 384 numbers per row live
          inside the model file.
        </p>
      </Panel>
    </>
  );
}

const STATIC_SENTENCES = ["The bank approved the loan", "The river bank flooded", "I deposited cash at the bank", "We had a picnic on the river bank"];

export function StaticContextualView() {
  const model = useEmbeddings();
  const e = model.embedder;
  const run = useModelRun(e ? () => Promise.all(STATIC_SENTENCES.map((s) => e.embedTokens(s))) : null, STATIC_SENTENCES.join("|"));
  const result = run.value;
  const vecs = result?.map((r) => r.vectors[findWord(r.tokens, "bank")[0]?.[0] ?? -1]);
  return (
    <Panel title="“bank” in four sentences: static vs contextual">
      <ModelStatus state={model}>
        {run.error && <ModelRunError />}
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-1 font-normal">Pair</th>
              <th className="py-1 text-right font-normal">Static</th>
              <th className="py-1 text-right font-normal">Contextual (MiniLM)</th>
            </tr>
          </thead>
          <tbody>
            {STATIC_SENTENCES.flatMap((a, i) =>
              STATIC_SENTENCES.slice(i + 1).map((b, k) => {
                const j = i + k + 1;
                const sim = vecs && vecs[i] && vecs[j] ? cosine(vecs[i]!, vecs[j]!) : null;
                return (
                  <tr key={`${i}-${j}`} className="border-t border-slate-800">
                    <td className="py-1.5 pr-3 text-xs text-slate-300">
                      {a} ↔ {b}
                    </td>
                    <td className="py-1.5 text-right font-mono text-slate-500">1.00</td>
                    <td className="py-1.5 text-right font-mono text-sky-200">{sim === null ? "…" : sim.toFixed(2)}</td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </ModelStatus>
    </Panel>
  );
}

export function BankShiftView() {
  const model = useEmbeddings();
  const e = model.embedder;
  const [a, setA] = useState("The bank approved the loan");
  const [b, setB] = useState("The river bank flooded");
  const run = useModelRun(e ? () => Promise.all([e.embedTokens(a), e.embedTokens(b)]) : null, `${a}|${b}`);
  const result = run.value;
  const hitsA = result ? findWord(result[0].tokens, "bank") : [];
  const hitsB = result ? findWord(result[1].tokens, "bank") : [];
  const missing = result !== null && (hitsA.length === 0 || hitsB.length === 0);
  const vecOf = (r: { vectors: Float32Array[] }, group: number[]) => meanPool(group.map((i) => r.vectors[i]!));
  const sim = result && !missing ? cosine(vecOf(result[0], hitsA[0]!), vecOf(result[1], hitsB[0]!)) : null;

  return (
    <>
      <Panel title="Two sentences containing “bank”">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextBox label="Sentence A" value={a} onChange={setA} rows={1} maxLength={200} />
          <TextBox label="Sentence B" value={b} onChange={setB} rows={1} maxLength={200} />
        </div>
      </Panel>
      <Panel title="Contextual vectors for “bank” (MiniLM, first 48 of 384 numbers)">
        <ModelStatus state={model}>
          {run.error && <ModelRunError />}
          <LongInputNote show={!!e && (e.isTruncated(a) || e.isTruncated(b))} />
          {missing ? (
            <p className="text-sm text-amber-200">Type the word bank in both sentences.</p>
          ) : (
            <>
              {result && (
                <div className="space-y-2">
                  {[result[0], result[1]].map((r, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 font-mono text-xs text-slate-400">{i === 0 ? "A" : "B"}</span>
                      <Strip v={vecOf(r, (i === 0 ? hitsA : hitsB)[0]!)} />
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 max-w-xs" data-testid="bank-sim">
                <Stat label="Cosine similarity" value={sim === null ? "…" : sim.toFixed(2)} sub="1.00 = same direction" />
              </div>
              {(hitsA.length > 1 || hitsB.length > 1) && (
                <p className="mt-2 text-xs text-slate-400">“bank” appears more than once; comparing the first “bank” in each sentence.</p>
              )}
            </>
          )}
        </ModelStatus>
      </Panel>
    </>
  );
}

export function SentenceEmbeddingsView() {
  const model = useEmbeddings();
  const e = model.embedder;
  const [text, setText] = useState("The bank approved the loan");
  const run = useModelRun(e && text.trim() ? () => e.embedTokens(text, { withSpecial: true }) : null, text);
  const result = run.value;
  const pooled = result && result.vectors.length ? meanPool(result.vectors) : null;
  const SHOWN = 12;
  return (
    <Panel title="Mean pooling: token vectors → one sentence vector">
      <TextBox label="Sentence" value={text} onChange={setText} rows={1} maxLength={200} />
      <div className="mt-4">
        <ModelStatus state={model}>
          {run.error && <ModelRunError />}
          <LongInputNote show={!!e && e.isTruncated(text)} />
          {result && (
            <div className="space-y-1.5">
              {result.tokens.length > SHOWN && (
                <p className="text-xs text-slate-500">
                  Showing the first {SHOWN} of {result.tokens.length} rows; all {result.tokens.length} are averaged.
                </p>
              )}
              {result.tokens.slice(0, SHOWN).map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-24 truncate text-right font-mono text-xs text-slate-400">{t}</span>
                  <Strip v={result.vectors[i]!} />
                </div>
              ))}
              {pooled && (
                <div className="flex items-center gap-3 border-t border-slate-700 pt-2">
                  <span className="w-24 text-right text-xs font-semibold text-sky-200">average</span>
                  <Strip v={pooled} />
                </div>
              )}
            </div>
          )}
        </ModelStatus>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        MiniLM averages every position, including its [CLS] and [SEP] markers, then scales the result to length 1: that is its sentence
        vector. Shown: first 48 of 384 numbers.
      </p>
    </Panel>
  );
}

const DEFAULT_SIM = ["How do I reset my password?", "I forgot my login details", "What's the weather like tomorrow?", "Our quarterly revenue grew by 12%", "The bank approved the loan", "The river bank flooded"].join("\n");

export function SimilarityView() {
  const model = useEmbeddings();
  const e = model.embedder;
  const [text, setText] = useState(DEFAULT_SIM);
  const all = text.split("\n").map((s) => s.trim()).filter(Boolean);
  const sentences = all.slice(0, MAX_SENTENCES);
  const run = useModelRun(e && sentences.length ? () => e.embedSentences(sentences) : null, sentences.join("\n"));
  const vecs = run.value;
  return (
    <>
      <Panel title="Sentences (one per line, up to 8)">
        <TextBox label="Sentences" value={text} onChange={setText} rows={6} maxLength={2000} />
        {all.length > MAX_SENTENCES && <p className="mt-1 text-xs text-amber-200">Using the first 8 sentences.</p>}
      </Panel>
      <Panel title="Cosine similarity matrix (MiniLM)">
        <ModelStatus state={model}>
          {run.error && <ModelRunError />}
          <LongInputNote show={!!e && sentences.some((x) => e.isTruncated(x))} />
          {vecs && (
            <div className="overflow-x-auto">
              <table className="text-xs">
                <tbody>
                  {sentences.map((s, i) => (
                    <tr key={i}>
                      <th className="max-w-[14rem] truncate pr-2 text-right font-normal text-slate-400" title={s}>
                        {s}
                      </th>
                      {sentences.map((_, j) => {
                        const v = cosine(vecs[i]!, vecs[j]!);
                        return (
                          <td key={j} data-testid="sim-cell" className="h-8 w-12 text-center font-mono text-slate-950" style={{ backgroundColor: `rgba(56,189,248,${Math.max(0.05, v)})` }}>
                            {v.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ModelStatus>
      </Panel>
    </>
  );
}

const CORPUS = ["How do I reset my password?", "I forgot my login details", "What's the weather like tomorrow?", "Our quarterly revenue grew by 12%", "The bank approved the loan", "The river bank flooded"];

export function SearchPreviewView() {
  const model = useEmbeddings();
  const e = model.embedder;
  const [query, setQuery] = useState("I can't sign in to my account");
  const run = useModelRun(e && query.trim() ? () => e.embedSentences([query, ...CORPUS]) : null, query);
  const vecs = run.value;
  const ranked = vecs ? CORPUS.map((d, i) => ({ d, s: cosine(vecs[0]!, vecs[i + 1]!) })).sort((x, y) => y.s - x.s) : [];
  return (
    <Panel title="Semantic search over six documents" icon={<Search size={14} />}>
      <TextBox label="Query" value={query} onChange={setQuery} rows={1} maxLength={200} />
      <div className="mt-4">
        <ModelStatus state={model}>
          {run.error && <ModelRunError />}
          <LongInputNote show={!!e && e.isTruncated(query)} />
          <ol className="space-y-1.5">
            {ranked.map((r, i) => (
              <li key={r.d} data-testid={`rank-${i + 1}`} className="flex items-center gap-3 text-sm">
                <span className="w-5 font-mono text-xs text-slate-500">{i + 1}</span>
                <span className="flex-1 text-slate-200">{r.d}</span>
                <span className="font-mono text-xs text-sky-200">{r.s.toFixed(2)}</span>
              </li>
            ))}
          </ol>
        </ModelStatus>
      </div>
      <p className="mt-3 text-xs text-slate-500">Module 08 builds this into a full retrieval-augmented generation (RAG) pipeline.</p>
    </Panel>
  );
}
