/** Concept labs for Module 02, steps 5–6 (bytes; WordPiece). */
import { Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Panel, Segmented } from "../../../../components/ui";
import { ProbBars } from "../../../01-intro-llms/views/labkit";
import tokens from "../../deep/data/tokens.json";
import { useRealTokenizer } from "../../useRealTokenizer";
import { encodeWordPiece, loadBertVocab, type WordPieceVocab } from "../../wordpiece";

const area = "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 font-mono text-sm text-slate-100";
const btn = "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 disabled:opacity-40";

/* ------------------------------------------------------------------ the byte tax */

/** Lab: how far GPT-4o's merges compress each sample's UTF-8 bytes. */
export function ByteTaxLab() {
  const rows = tokens.languages.map((l) => ({ l, ratio: l.utf8_bytes / l.o200k_base, oldRatio: l.utf8_bytes / l.cl100k_base }));
  const max = Math.max(...rows.map((r) => r.ratio));
  const [enc, setEnc] = useState<"o200k_base" | "cl100k_base">("o200k_base");
  return (
    <Panel title="How much do merges compress the bytes?">
      <Segmented<"o200k_base" | "cl100k_base"> label="Tokenizer" value={enc} options={[{ value: "o200k_base", label: "GPT-4o" }, { value: "cl100k_base", label: "GPT-4" }]} onChange={setEnc} />
      <div className="mt-3">
        <ProbBars
          label="UTF-8 bytes per token"
          format={(v) => (v * max).toFixed(1)}
          items={rows.map((r) => ({ label: r.l.label, value: (enc === "o200k_base" ? r.ratio : r.oldRatio) / max, note: `${r.l.utf8_bytes} bytes → ${enc === "o200k_base" ? r.l.o200k_base : r.l.cl100k_base} tokens` }))}
        />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        Higher = the tokenizer spent more merges on this kind of text. Hindi: {(rows.find((r) => r.l.label === "Hindi")!.oldRatio).toFixed(1)} bytes per token with GPT-4, {(rows.find((r) => r.l.label === "Hindi")!.ratio).toFixed(1)} with GPT-4o.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ GPT-2's printable stand-ins */

/** GPT-2's bytes_to_unicode table: visible bytes stand for themselves, the rest get chr(256 + n) in byte order. */
export function bytesToUnicode(): Map<number, string> {
  const visible: number[] = [];
  for (let b = 33; b <= 126; b++) visible.push(b);
  for (let b = 161; b <= 172; b++) visible.push(b);
  for (let b = 174; b <= 255; b++) visible.push(b);
  const m = new Map<number, string>(visible.map((b) => [b, String.fromCharCode(b)]));
  let n = 0;
  for (let b = 0; b < 256; b++) if (!m.has(b)) m.set(b, String.fromCharCode(256 + n++));
  return m;
}
const B2U = bytesToUnicode();

/** Lab: any text as a GPT-2-style vocabulary file prints it. */
export function ByteStandinsLab() {
  const [text, setText] = useState(" the cat\nsat é");
  const bytes = Array.from(new TextEncoder().encode(text));
  return (
    <Panel title="Why vocabulary files show Ġ">
      <label className="block text-xs text-slate-400">
        Text (spaces and new lines included)
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className={area} />
      </label>
      <p role="status" className="mt-3 font-mono text-lg text-violet-200">
        {bytes.map((b) => B2U.get(b)).join("")}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Each UTF-8 byte replaced by its printable stand-in: space (byte 32) → Ġ, newline (byte 10) → Ċ, and é&apos;s two bytes → Ã©.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ streaming real tokens */

const BYTE_TOKENS = tokens.byte_tokens as Record<string, Record<"cl100k_base" | "o200k_base", { id: number; bytes: number[] }[]>>;

/** Lab: real tokens arriving one by one, decoded naively (each alone) or safely (incrementally). */
export function StreamDecodeLab() {
  const texts = Object.keys(BYTE_TOKENS);
  const [text, setText] = useState(texts[1]!);
  const [enc, setEnc] = useState<"cl100k_base" | "o200k_base">("cl100k_base");
  const [n, setN] = useState(0);
  const toks = BYTE_TOKENS[text]![enc];
  const naive = toks.slice(0, n).map((t) => new TextDecoder().decode(new Uint8Array(t.bytes))).join("");
  const safe = useMemo(() => {
    const d = new TextDecoder("utf-8");
    return toks
      .slice(0, n)
      .map((t, i) => d.decode(new Uint8Array(t.bytes), { stream: i < n - 1 || n < toks.length }))
      .join("");
  }, [toks, n]);
  return (
    <Panel title="Streaming tokens that aren't whole characters">
      <div className="grid gap-2 sm:grid-cols-2">
        <Segmented label="Text" value={text} options={texts.map((t) => ({ value: t, label: t }))} onChange={(t) => { setText(t); setN(0); }} />
        <Segmented<"cl100k_base" | "o200k_base"> label="Tokenizer" value={enc} options={[{ value: "cl100k_base", label: "GPT-4" }, { value: "o200k_base", label: "GPT-4o" }]} onChange={(e) => { setEnc(e); setN(0); }} />
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" className={btn} disabled={n >= toks.length} onClick={() => setN((x) => x + 1)}>
          <Play size={14} aria-hidden="true" /> Next token ({n}/{toks.length})
        </button>
        <button type="button" className={btn} onClick={() => setN(0)}>
          <RotateCcw size={14} aria-hidden="true" /> Reset
        </button>
      </div>
      <p className="mt-2 font-mono text-xs text-slate-400">bytes so far: {toks.slice(0, n).map((t) => `[${t.bytes.join(" ")}]`).join(" ")}</p>
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-rose-500/40 p-2">
          <dt className="text-xs text-rose-300">Naive: decode each token alone</dt>
          <dd className="font-mono text-lg text-slate-100">{naive || "—"}</dd>
        </div>
        <div className="rounded-lg border border-emerald-500/40 p-2">
          <dt className="text-xs text-emerald-300">Safe: hold back unfinished characters</dt>
          <dd role="status" className="font-mono text-lg text-slate-100">
            {safe || "—"}
          </dd>
        </div>
      </dl>
      <p className="mt-1 text-[11px] text-slate-500">Real token byte sequences from GPT-4&apos;s and GPT-4o&apos;s tokenizers. � is the replacement character for broken bytes.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ WordPiece: real BERT vocabulary */

function useBert() {
  const [v, setV] = useState<WordPieceVocab | null>(null);
  useEffect(() => {
    let live = true;
    void loadBertVocab().then((x) => live && setV(x));
    return () => {
      live = false;
    };
  }, []);
  return v;
}

/** Lab: BERT's real WordPiece; any word with an unknown character becomes a single [UNK]. */
export function WpUnkLab() {
  const vocab = useBert();
  const [text, setText] = useState("great👍 robot🤖 café naïve");
  if (!vocab)
    return (
      <Panel title="All or nothing: [UNK]">
        <p role="status" className="text-sm text-slate-400">
          Loading BERT&apos;s real vocabulary…
        </p>
      </Panel>
    );
  const { tokens: toks } = encodeWordPiece(text, vocab);
  const unk = toks.filter((t) => t.text === "[UNK]").length;
  return (
    <Panel title="All or nothing: a whole word becomes [UNK]">
      <label className="block text-xs text-slate-400">
        Text
        <input value={text} onChange={(e) => setText(e.target.value)} className={area} />
      </label>
      <p className="mt-3 flex flex-wrap gap-1">
        {toks.map((t, i) => (
          <span key={i} className={`rounded border px-1.5 font-mono text-xs ${t.text === "[UNK]" ? "border-rose-500/60 bg-rose-500/10 text-rose-200" : "border-slate-700 text-slate-200"}`}>
            {t.text} <span className="text-slate-500">{t.id}</span>
          </span>
        ))}
      </p>
      <p role="status" className="mt-2 text-sm text-slate-200">
        {toks.length} pieces, {unk} [UNK]. The word around an unknown character is lost entirely.
      </p>
      <p className="mt-1 text-[11px] text-slate-500">BERT&apos;s real bert-base-uncased vocabulary (30,522 entries), with its lower-casing and accent stripping.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ WordPiece score vs BPE count */

export function firstPairs(corpus: string) {
  const words = new Map<string, number>();
  for (const w of corpus.split(/\s+/).filter(Boolean)) words.set(w, (words.get(w) ?? 0) + 1);
  const sym = new Map<string, number>();
  const pair = new Map<string, number>();
  for (const [w, n] of words) {
    const s = [...Array.from(w), "</w>"];
    for (const x of s) sym.set(x, (sym.get(x) ?? 0) + n);
    for (let i = 0; i + 1 < s.length; i++) {
      const k = `${s[i]} + ${s[i + 1]}`;
      pair.set(k, (pair.get(k) ?? 0) + n);
    }
  }
  const rows = [...pair].map(([k, c]) => {
    const [a, b] = k.split(" + ") as [string, string];
    return { pair: k, count: c, score: c / (sym.get(a)! * sym.get(b)!) };
  });
  return {
    byCount: [...rows].sort((x, y) => y.count - x.count),
    byScore: [...rows].sort((x, y) => y.score - x.score),
  };
}

/** Lab: on any corpus, the pairs BPE merges first (count) vs those WordPiece merges first (score). */
export function WpScoreLab() {
  const [corpus, setCorpus] = useState(`${"low ".repeat(5)}${"lower ".repeat(2)}${"newest ".repeat(6)}${"widest ".repeat(3)}`.trim());
  const { byCount, byScore } = firstPairs(corpus);
  return (
    <Panel title="Which pair goes first: count or score?">
      <label className="block text-xs text-slate-400">
        Training text
        <textarea value={corpus} onChange={(e) => setCorpus(e.target.value)} rows={2} className={area} />
      </label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ol aria-label="BPE: highest count" className="space-y-1 text-sm">
          <li className="text-xs font-semibold uppercase tracking-wider text-slate-400">BPE (count)</li>
          {byCount.slice(0, 4).map((r) => (
            <li key={r.pair} className="font-mono text-slate-200">
              {r.pair} · {r.count}
            </li>
          ))}
        </ol>
        <ol aria-label="WordPiece: highest score" className="space-y-1 text-sm">
          <li className="text-xs font-semibold uppercase tracking-wider text-slate-400">WordPiece (score)</li>
          {byScore.slice(0, 4).map((r) => (
            <li key={r.pair} className="font-mono text-violet-200">
              {r.pair} · {r.score.toFixed(3)}
            </li>
          ))}
        </ol>
      </div>
      <p role="status" className="mt-2 text-sm text-slate-200">
        BPE merges {byCount[0]?.pair ?? "—"} first; WordPiece merges {byScore[0]?.pair ?? "—"} first.
      </p>
      <p className="mt-1 text-[11px] text-slate-500">score = count(ab) / (count(a) × count(b)): it favours pairs whose parts rarely appear apart.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ BERT pieces vs GPT-4o tokens */

/** Lab: how many pieces BERT's WordPiece and GPT-4o's BPE need for the same words. */
export function WpFertilityLab() {
  const vocab = useBert();
  const [text, setText] = useState("kubernetes\nhuggingface\nembeddings\nmortgage\nrefinancing");
  const words = text.split("\n").map((w) => w.trim()).filter(Boolean).slice(0, 8);
  const gpt = useRealTokenizer("o200k_base", words.join("\n"));
  const ready = vocab && gpt.encoder;
  return (
    <Panel title="BERT's WordPiece vs GPT-4o's BPE">
      <label className="block text-xs text-slate-400">
        Words (one per line)
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className={area} />
      </label>
      {ready ? (
        <table className="mt-3 w-full text-left text-sm">
          <caption className="sr-only">Pieces per word</caption>
          <thead className="text-xs text-slate-500">
            <tr>
              <th className="py-1 font-medium">word</th>
              <th className="py-1 font-medium">BERT pieces</th>
              <th className="py-1 font-medium">GPT-4o tokens</th>
            </tr>
          </thead>
          <tbody>
            {words.map((w) => {
              const bp = encodeWordPiece(w, vocab!).tokens;
              return (
                <tr key={w} className="border-t border-slate-800">
                  <td className="py-1 font-mono text-slate-100">{w}</td>
                  <td className="py-1 font-mono text-slate-300">
                    {bp.length} <span className="text-[11px] text-slate-500">{bp.map((t) => t.text).join(" ")}</span>
                  </td>
                  <td className="py-1 font-mono text-violet-300">{gpt.encoder!.encode(w).length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p role="status" className="mt-2 text-sm text-slate-400">
          Loading BERT&apos;s and GPT-4o&apos;s real tokenizers…
        </p>
      )}
      <p className="mt-1 text-[11px] text-slate-500">When an embedding model like MiniLM has a 256-piece limit, it&apos;s WordPiece pieces that count.</p>
    </Panel>
  );
}
