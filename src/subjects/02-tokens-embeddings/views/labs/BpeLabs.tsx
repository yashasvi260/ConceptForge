/** Concept labs for Module 02, steps 3–4 (BPE training and encoding). */
import { Shuffle } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel, Segmented, Slider, Toggle } from "../../../../components/ui";
import { ProbBars } from "../../../01-intro-llms/views/labkit";
import { encodeBpe, trainBpe } from "../../bpe";
import { useRealTokenizer } from "../../useRealTokenizer";

const piece = (b: Uint8Array) => new TextDecoder().decode(b).replace(/ /g, "␣");

/** Sennrich, Haddow & Birch (2016): low ×5, lower ×2, newest ×6, widest ×3 (the same corpus the BPE views start with). */
export const SENNRICH = `${"low ".repeat(5)}${"lower ".repeat(2)}${"newest ".repeat(6)}${"widest ".repeat(3)}`.trim();
const area = "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 font-mono text-sm text-slate-100";
const btn = "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-slate-500";

/** Total symbols in the corpus (characters plus one end-of-word marker per word). */
export function corpusSymbols(corpus: string): number {
  return corpus.split(/\s+/).filter(Boolean).reduce((s, w) => s + Array.from(w).length + 1, 0);
}

/* ------------------------------------------------------------------ BPE as compression */

/** Lab: every merge shortens the corpus by its count; watch the corpus shrink. */
export function BpeCompressLab() {
  const [n, setN] = useState(10);
  const { merges } = useMemo(() => trainBpe(SENNRICH, 10), []);
  const start = corpusSymbols(SENNRICH);
  let left = start;
  const rows = merges.slice(0, n).map((m) => {
    left -= m.count;
    return { label: `${m.pair[0]}+${m.pair[1]} (−${m.count})`, value: left / start };
  });
  return (
    <Panel title="BPE is a compressor: each merge shortens the text">
      <Slider label="Merges" min={0} max={10} step={1} value={n} onChange={setN} />
      <div className="mt-3">
        <ProbBars label="Symbols left after each merge" format={(v) => String(Math.round(v * start))} items={[{ label: "start", value: 1 }, ...rows]} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        {start} symbols → {left} after {n} merge{n === 1 ? "" : "s"}. A pair that occurs n times saves exactly n symbols, so the most frequent pair saves the most.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ pre-tokenization */

const PATTERN = /'(?:ll|ve|re|[stmd])| ?[^\W\d_]+|\d{1,3}| ?[^\s\w]+|\s+/gu;

/** Lab: the chunks BPE runs on; merges never cross a chunk boundary. */
export function PretokenizeLab() {
  const [text, setText] = useState("I'm paying 1250.75 dollars, OK?");
  const chunks = text.match(PATTERN) ?? [];
  return (
    <Panel title="Pre-tokenization: the rules before BPE">
      <label className="block text-xs text-slate-400">
        Text
        <input value={text} onChange={(e) => setText(e.target.value)} className={area} />
      </label>
      <p role="status" className="mt-3 flex flex-wrap gap-1">
        {chunks.map((c, i) => (
          <span key={i} className="rounded border border-violet-500/50 bg-violet-500/10 px-1 font-mono text-xs text-violet-100">
            {c.replace(/ /g, "␣")}
          </span>
        ))}
      </p>
      <p className="mt-2 text-xs text-slate-400">
        {chunks.length} chunks. Words keep their leading space, numbers come in chunks of up to 3 digits, punctuation stands apart. BPE merges only inside a chunk.
      </p>
      <p className="mt-1 text-[11px] text-slate-500">A simplified GPT-style pattern; real tokenizers use longer ones with the same idea.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ diminishing returns */

const PARAGRAPH = "the bank approved the loan and the customer repaid the loan the bank then raised the interest rate on the loan the customer asked the bank about the rate";

/** Lab: on a real paragraph, early merges save a lot and later merges save less and less. */
export function MergesCurveLab() {
  const [text, setText] = useState(PARAGRAPH);
  const [n, setN] = useState(25);
  const { merges } = useMemo(() => trainBpe(text, n), [text, n]);
  const max = Math.max(1, ...merges.map((m) => m.count));
  return (
    <Panel title="Diminishing returns: what each new merge saves">
      <label className="block text-xs text-slate-400">
        Training text
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className={area} />
      </label>
      <div className="mt-2">
        <Slider label="Merges to learn" min={5} max={60} step={1} value={n} onChange={setN} />
      </div>
      <div className="mt-2">
        <ProbBars label="Symbols saved by each merge" format={(v) => String(Math.round(v * max))} items={merges.slice(0, 12).map((m, i) => ({ label: `#${i + 1} ${m.merged}`, value: m.count / max }))} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        Merge 1 saves {merges[0]?.count ?? 0}; merge {merges.length} saves {merges.at(-1)?.count ?? 0}. Each extra vocabulary entry buys less.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ merge order matters */

/** Lab: encode a word with the learned merges in their learned order, reversed, or shuffled. */
export function MergeOrderLab({ rand = Math.random }: { rand?: () => number }) {
  const [word, setWord] = useState("lowest");
  const [order, setOrder] = useState<"learned" | "reversed" | "shuffled">("learned");
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const learned = useMemo(() => trainBpe(SENNRICH, 10).merges, []);
  const merges = useMemo(() => {
    void shuffleSeed;
    if (order === "learned") return learned;
    if (order === "reversed") return [...learned].reverse();
    return [...learned].sort(() => rand() - 0.5);
  }, [order, learned, shuffleSeed, rand]);
  const out = encodeBpe(word, merges).tokens;
  const ref = encodeBpe(word, learned).tokens;
  return (
    <Panel title="Order matters: the same merges, replayed differently">
      <label className="block text-xs text-slate-400">
        Word
        <input value={word} onChange={(e) => setWord(e.target.value.trim())} className={area} />
      </label>
      <div className="mt-2">
        <Segmented<"learned" | "reversed" | "shuffled"> label="Merge order" value={order} options={[{ value: "learned", label: "As learned" }, { value: "reversed", label: "Reversed" }, { value: "shuffled", label: "Shuffled" }]} onChange={setOrder} />
      </div>
      {order === "shuffled" && (
        <button type="button" className={`${btn} mt-2`} onClick={() => setShuffleSeed((x) => x + 1)}>
          <Shuffle size={14} aria-hidden="true" /> Shuffle again
        </button>
      )}
      <p role="status" className="mt-3 font-mono text-sm text-emerald-300">
        {out.join(" ")}
      </p>
      <p className="mt-1 text-xs text-slate-400">{out.join(" ") === ref.join(" ") ? "Same split as the learned order." : `Different from the learned order (${ref.join(" ")}): the model was trained on the learned order's splits.`}</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ fertility with GPT-4o */

/** Lab: real GPT-4o tokens per word for familiar words, typos and jargon. */
export function FertilityLab() {
  const [text, setText] = useState("weather\nslowly\nslowwly\npharmacokinetics\nERR_CERT_DATE_INVALID");
  const words = text.split("\n").map((w) => w.trim()).filter(Boolean).slice(0, 10);
  const tok = useRealTokenizer("o200k_base", words.join("\n"));
  const enc = tok.encoder;
  const rows = enc ? words.map((w) => ({ w, n: enc.encode(w).length })) : [];
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <Panel title="How familiar is a word? Count its tokens">
      <label className="block text-xs text-slate-400">
        Words (one per line)
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className={area} />
      </label>
      {enc ? (
        <div className="mt-2">
          <ProbBars label="GPT-4o tokens per word" format={(v) => String(Math.round(v * max))} items={rows.map((r) => ({ label: r.w, value: r.n / max, highlight: r.n === 1 }))} />
        </div>
      ) : (
        <p role="status" className="mt-2 text-sm text-slate-400">
          Loading GPT-4o&apos;s real tokenizer…
        </p>
      )}
      <p className="mt-1 text-[11px] text-slate-500">Real GPT-4o tokenizer. One token = a word the tokenizer saw often; many = rare, misspelt or specialised.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ small edits, different tokens */

/** Lab: one word with and without a leading space, capitalised, and in capitals, through GPT-4o. */
export function VariantsLab() {
  const [word, setWord] = useState("strawberry");
  const [space, setSpace] = useState(true);
  const forms = [word, ` ${word}`, word.charAt(0).toUpperCase() + word.slice(1), word.toUpperCase()].filter((_, i) => space || i !== 1);
  const tok = useRealTokenizer("o200k_base", forms.join("|"));
  const enc = tok.encoder;
  return (
    <Panel title="Small edits, different tokens">
      <label className="block text-xs text-slate-400">
        Word
        <input value={word} onChange={(e) => setWord(e.target.value.trim() || "strawberry")} className={area} />
      </label>
      <div className="mt-2">
        <Toggle label="Include the leading-space form" checked={space} onChange={setSpace} />
      </div>
      {enc ? (
        <table className="mt-3 w-full text-left text-sm">
          <caption className="sr-only">Forms</caption>
          <tbody>
            {forms.map((f) => {
              const ids = enc.encode(f);
              return (
                <tr key={f} className="border-t border-slate-800">
                  <td className="py-1 font-mono text-slate-100">{JSON.stringify(f)}</td>
                  <td className="py-1 font-mono text-violet-200">{ids.map((id) => piece(enc.tokenBytes(id))).join(" | ")}</td>
                  <td className="py-1 font-mono text-slate-300">{ids.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p role="status" className="mt-2 text-sm text-slate-400">
          Loading GPT-4o&apos;s real tokenizer…
        </p>
      )}
      <p className="mt-1 text-[11px] text-slate-500">Real GPT-4o pieces. To the model these are different inputs that it has to learn are related.</p>
    </Panel>
  );
}
