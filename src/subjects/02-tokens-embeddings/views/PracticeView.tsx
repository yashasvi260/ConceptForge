import { Coins, Layers, Ruler } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel, Slider, Stat } from "../../../components/ui";
import { chunkByTokens, estimateCost } from "../practice";
import { decodeTokens } from "../realTokenizers";
import { useRealTokenizer } from "../useRealTokenizer";
import { TextBox, TokenizerStatus, formatInt } from "./common";

const DEFAULT_DOC = `Tokenization is the first step of every language model pipeline. Before a model can read a single word, a tokenizer cuts the text into pieces and replaces each piece with a number from its vocabulary.

Because models are billed, limited and chunked in tokens, knowing how many tokens a document uses tells you what it will cost, whether it fits in the model's context window, and how to split it for retrieval.

Different models use different tokenizers, so the same paragraph can be a different number of tokens depending on which model you call. Always count with the tokenizer of the model you will actually use.`;

function NumberField({ label, value, onChange, step = 1, hint }: { label: string; value: number; onChange: (v: number) => void; step?: number; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-300">{label}</span>
      <input
        type="number"
        aria-label={label}
        min={0}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-slate-100 focus:border-sky-500 focus:outline-none"
      />
      {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function PracticeView() {
  const [text, setText] = useState(DEFAULT_DOC);
  const [price, setPrice] = useState(2.5);
  const [windowSize, setWindowSize] = useState(128_000);
  const [reserve, setReserve] = useState(1_000);
  const [chunk, setChunk] = useState(64);
  const [overlap, setOverlap] = useState(8);
  const tk = useRealTokenizer("o200k_base", text);
  // Count every token: the 4,000-character cap is only for drawing token chips.
  const ids = useMemo(() => (tk.encoder ? tk.encoder.encode(text) : []), [tk.encoder, text]);
  const n = ids.length;
  const fits = n + reserve <= windowSize;
  const safeOverlap = Math.min(overlap, chunk - 1);
  const chunks = chunkByTokens(ids, chunk, safeOverlap);
  const decode = (a: number, b: number) => (tk.encoder ? decodeTokens(tk.encoder, ids.slice(a, b)) : "");

  return (
    <>
      <Panel title="Your document">
        <TextBox label="Document" value={text} onChange={setText} rows={6} maxLength={50_000} />
      </Panel>
      <TokenizerStatus state={tk}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Cost" icon={<Coins size={14} />}>
            <NumberField label="Price per 1M input tokens ($)" value={price} onChange={setPrice} step={0.05} hint="Example price: check your provider's current pricing." />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat label="Tokens (GPT-4o)" value={formatInt(n)} />
              <Stat label="Cost per request" value={`$${estimateCost(n, price).toFixed(6)}`} sub={`× 10,000 requests = $${estimateCost(n * 10_000, price).toFixed(2)}`} />
            </div>
          </Panel>
          <Panel title="Context window" icon={<Ruler size={14} />}>
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Context window (tokens)" value={windowSize} onChange={setWindowSize} step={1000} hint="Example size." />
              <NumberField label="Reserve for the answer (max_tokens)" value={reserve} onChange={setReserve} step={100} />
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded bg-slate-800" aria-hidden>
              <div className="flex h-full">
                <div className={fits ? "bg-sky-500" : "bg-rose-500"} style={{ width: `${Math.min(100, (n / Math.max(1, windowSize)) * 100)}%` }} />
                <div className="bg-amber-400/70" style={{ width: `${Math.min(100, (reserve / Math.max(1, windowSize)) * 100)}%` }} />
              </div>
            </div>
            <p data-testid="context-status" className={`mt-2 text-sm ${fits ? "text-emerald-300" : "text-rose-300"}`}>
              {fits
                ? `Fits: ${formatInt(n)} prompt + ${formatInt(reserve)} answer ≤ ${formatInt(windowSize)}.`
                : `Doesn't fit: ${formatInt(n)} prompt + ${formatInt(reserve)} answer > ${formatInt(windowSize)}. Trim, summarise or chunk it.`}
            </p>
          </Panel>
        </div>
        <Panel title="Chunking for RAG (by tokens, with overlap)" icon={<Layers size={14} />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Slider label="Chunk size" value={chunk} min={8} max={512} step={8} onChange={(v) => setChunk(v)} format={(v) => `${v} tokens`} />
            <Slider label="Overlap" value={safeOverlap} min={0} max={Math.min(128, chunk - 1)} onChange={setOverlap} format={(v) => `${v} tokens`} />
          </div>
          <p className="mt-3 text-sm text-slate-300">
            {chunks.length} chunk{chunks.length === 1 ? "" : "s"}. The overlap repeats the end of each chunk at the start of the next, so a
            sentence cut at a boundary is still whole somewhere.
          </p>
          <ol className="mt-3 space-y-2">
            {chunks.slice(0, 6).map(([a, b], i) => (
              <li key={i} className="rounded-lg bg-slate-950/60 p-2 text-xs">
                <span className="font-mono text-slate-500">
                  #{i + 1} · tokens {a}–{b - 1}
                </span>
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-slate-300">
                  {i > 0 && safeOverlap > 0 && <mark className="bg-amber-400/30 text-amber-100">{decode(a, a + safeOverlap)}</mark>}
                  {decode(i > 0 ? a + safeOverlap : a, b)}
                </p>
              </li>
            ))}
          </ol>
        </Panel>
      </TokenizerStatus>
    </>
  );
}
