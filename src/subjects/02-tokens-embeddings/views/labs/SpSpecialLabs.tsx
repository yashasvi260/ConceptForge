/** Concept labs for Module 02, steps 7–8 (SentencePiece/Unigram; special tokens). */
import { Dices } from "lucide-react";
import { useEffect, useState } from "react";
import { Panel, Slider, Toggle } from "../../../../components/ui";
import { ProbBars } from "../../../01-intro-llms/views/labkit";
import tokens from "../../deep/data/tokens.json";
import { UNIGRAM_VOCAB, UNKNOWN_CHAR_LOGPROB, normalize, relativeProbabilities, topSegmentations } from "../../unigram";
import { encodeWordPiece, loadBertVocab, type WordPieceVocab } from "../../wordpiece";

const area = "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 font-mono text-sm text-slate-100";
const btn = "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-slate-500";

/* ------------------------------------------------------------------ SentencePiece normalisation */

/** Lab: spaces become ▁, so the text can be rebuilt exactly from the pieces. */
export function SpNormalizeLab() {
  const [text, setText] = useState("hello   world, 日本語");
  const norm = normalize(text);
  const back = norm.replace(/▁/g, " ").trim();
  return (
    <Panel title="SentencePiece: spaces are just another symbol">
      <label className="block text-xs text-slate-400">
        Text
        <input value={text} onChange={(e) => setText(e.target.value)} className={area} />
      </label>
      <p className="mt-3 font-mono text-lg text-violet-200">{norm}</p>
      <p role="status" className="mt-2 text-sm text-slate-200">
        Rebuilt by joining the pieces and turning ▁ back into spaces: “{back}” {back === text.trim().replace(/\s+/g, " ") ? "— exact (after collapsing repeated spaces)" : ""}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">No word splitting needed, so Japanese and English go through the same code.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ the Viterbi table */

export function viterbiTable(text: string) {
  const s = Array.from(normalize(text));
  const best = [0, ...s.map(() => -Infinity)];
  const back = s.map(() => 0);
  const MAX = 12;
  for (let end = 1; end <= s.length; end++)
    for (let start = Math.max(0, end - MAX); start < end; start++) {
      const piece = s.slice(start, end).join("");
      const lp = UNIGRAM_VOCAB[piece] ?? (end - start === 1 ? UNKNOWN_CHAR_LOGPROB : undefined);
      if (lp !== undefined && best[start]! + lp > best[end]!) {
        best[end] = best[start]! + lp;
        back[end - 1] = start;
      }
    }
  return s.map((_, i) => ({ end: i + 1, prefix: s.slice(0, i + 1).join(""), best: best[i + 1]!, last: s.slice(back[i]!, i + 1).join("") }));
}

/** Lab: Viterbi fills a table of best prefix scores, one position at a time. */
export function ViterbiTableLab() {
  const [text, setText] = useState("hello world");
  const rows = viterbiTable(text);
  const [upto, setUpto] = useState(rows.length);
  const shown = rows.slice(0, Math.min(upto, rows.length));
  return (
    <Panel title="Viterbi: the best split without trying them all">
      <label className="block text-xs text-slate-400">
        Text
        <input value={text} onChange={(e) => { setText(e.target.value); setUpto(999); }} className={area} />
      </label>
      <div className="mt-2">
        <Slider label="Positions filled" min={1} max={Math.max(1, rows.length)} step={1} value={Math.min(upto, rows.length)} onChange={setUpto} />
      </div>
      <table className="mt-2 w-full text-left text-xs">
        <caption className="sr-only">Best prefix scores</caption>
        <thead className="text-slate-500">
          <tr>
            <th className="py-1 font-medium">prefix</th>
            <th className="py-1 font-medium">best score</th>
            <th className="py-1 font-medium">last piece</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr key={r.end} className="border-t border-slate-800">
              <td className="py-0.5 font-mono text-slate-200">{r.prefix}</td>
              <td className="py-0.5 font-mono text-slate-300">{r.best.toFixed(2)}</td>
              <td className="py-0.5 font-mono text-violet-300">{r.last}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p role="status" className="mt-2 text-xs text-slate-400">
        Each row uses only earlier rows: best[end] = max over start of best[start] + log p(piece). Read the last pieces backwards to get the split.
      </p>
      <p className="mt-1 text-[11px] text-slate-500">The Unigram view&apos;s small illustrative vocabulary (made-up counts), the same as the lesson.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ pruning and sampling */

/** Lab: sample different splits of the same text (subword regularization), weighted by probability. */
export function UnigramPruneLab({ rand = Math.random }: { rand?: () => number }) {
  const [text, setText] = useState("unbelievable tokenization");
  const [sample, setSample] = useState<string | null>(null);
  const segs = topSegmentations(text, 5);
  const p = relativeProbabilities(segs);
  const draw = () => {
    let r = rand();
    const i = p.findIndex((x) => (r -= x) < 0);
    setSample(segs[i < 0 ? segs.length - 1 : i]!.pieces.join(" "));
  };
  return (
    <Panel title="Sampling splits (subword regularization)">
      <label className="block text-xs text-slate-400">
        Text
        <input value={text} onChange={(e) => { setText(e.target.value); setSample(null); }} className={area} />
      </label>
      <div className="mt-3">
        <ProbBars label="The five most probable splits" items={segs.map((s, i) => ({ label: s.pieces.join(" "), value: p[i]! }))} />
      </div>
      <button type="button" className={`${btn} mt-2`} onClick={draw}>
        <Dices size={14} aria-hidden="true" /> Sample a split
      </button>
      <p role="status" className="mt-2 font-mono text-sm text-emerald-300">
        {sample ?? "—"}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Training on sampled splits teaches the model that different splits mean the same thing. At inference the best split is used.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ real special-token IDs */

const SP = tokens.special;
const ROWS: { tokenizer: string; token: string; id: number; job: string }[] = [
  { tokenizer: "BERT", token: "[CLS]", id: SP.bert["[CLS]"], job: "Starts every input; its output vector is used to classify the whole text." },
  { tokenizer: "BERT", token: "[SEP]", id: SP.bert["[SEP]"], job: "Ends a sentence, or separates two sentences in one input." },
  { tokenizer: "BERT", token: "[PAD]", id: SP.bert["[PAD]"], job: "Fills short inputs up to the batch length; masked out of attention." },
  { tokenizer: "BERT", token: "[MASK]", id: SP.bert["[MASK]"], job: "Hides a word during pre-training so the model learns to fill it in." },
  { tokenizer: "GPT-4", token: "<|endoftext|>", id: SP.gpt4_endoftext.special_id, job: "Marks the end of a document; generation stops when the model produces it." },
  { tokenizer: "Llama 3", token: "<|begin_of_text|>", id: SP.llama3["<|begin_of_text|>"], job: "Starts the whole prompt." },
  { tokenizer: "Llama 3", token: "<|start_header_id|>", id: SP.llama3["<|start_header_id|>"], job: "Opens a role name: system, user or assistant." },
  { tokenizer: "Llama 3", token: "<|eot_id|>", id: SP.llama3["<|eot_id|>"], job: "Ends one turn of the conversation." },
];

/** Lab: real special-token IDs and their jobs. */
export function SpecialIdsLab() {
  const [i, setI] = useState(0);
  return (
    <Panel title="Special tokens in three real tokenizers">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Special tokens</caption>
        <tbody>
          {ROWS.map((r, k) => (
            <tr key={r.token} onClick={() => setI(k)} className={`cursor-pointer border-t border-slate-800 ${k === i ? "bg-violet-500/10" : ""}`}>
              <td className="py-1 text-slate-400">{r.tokenizer}</td>
              <td className="py-1 font-mono text-slate-100">{r.token}</td>
              <td className="py-1 font-mono text-violet-300">{r.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p role="status" className="mt-2 text-sm text-slate-200">
        <span className="font-mono">{ROWS[i]!.token}</span>: {ROWS[i]!.job}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">IDs from BERT&apos;s vocab.txt, tiktoken, and Meta&apos;s Llama 3 tokenizer source. Click a row.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ chat template */

/** Lab: messages flattened into Llama 3's real chat format. */
export function ChatTemplateLab() {
  const [system, setSystem] = useState("You are a helpful bank assistant.");
  const [user, setUser] = useState("How do I reset my PIN?");
  const [genPrompt, setGenPrompt] = useState(true);
  const header = (role: string) => [{ t: "<|start_header_id|>", c: true }, { t: role, c: false }, { t: "<|end_header_id|>", c: true }, { t: "\n\n", c: false }];
  const parts = [
    { t: "<|begin_of_text|>", c: true },
    ...(system ? [...header("system"), { t: system.trim(), c: false }, { t: "<|eot_id|>", c: true }] : []),
    ...header("user"),
    { t: user.trim(), c: false },
    { t: "<|eot_id|>", c: true },
    ...(genPrompt ? header("assistant") : []),
  ];
  return (
    <Panel title="Chat templates: Llama 3's real format">
      <label className="block text-xs text-slate-400">
        System message
        <input value={system} onChange={(e) => setSystem(e.target.value)} className={area} />
      </label>
      <label className="mt-2 block text-xs text-slate-400">
        User message
        <input value={user} onChange={(e) => setUser(e.target.value)} className={area} />
      </label>
      <div className="mt-2">
        <Toggle label="Add the generation prompt (open assistant header)" checked={genPrompt} onChange={setGenPrompt} />
      </div>
      <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs">
        {parts.map((p, i) => (
          <span key={i} className={p.c ? "rounded bg-violet-500/20 text-violet-200" : "text-slate-200"}>
            {p.t}
          </span>
        ))}
      </pre>
      <p role="status" className="mt-2 text-sm text-slate-200">
        {parts.filter((p) => p.c).length} control tokens.{" "}
        {genPrompt ? "The prompt ends with an open assistant header: the model's job is to write the reply." : "Without the open assistant header, the model may just continue the user's message."}
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ padding and masks with real BERT IDs */

/** Lab: a batch of real BERT token IDs padded to one length, with attention masks. */
export function PaddingMaskLab() {
  const [vocab, setVocab] = useState<WordPieceVocab | null>(null);
  const [maxLen, setMaxLen] = useState(10);
  const [text, setText] = useState("the bank approved the loan\nhi\nthe river bank flooded after the storm last night");
  useEffect(() => {
    let live = true;
    void loadBertVocab().then((v) => live && setVocab(v));
    return () => {
      live = false;
    };
  }, []);
  if (!vocab)
    return (
      <Panel title="Padding and attention masks">
        <p role="status" className="text-sm text-slate-400">
          Loading BERT&apos;s real vocabulary…
        </p>
      </Panel>
    );
  const rows = text
    .split("\n")
    .filter(Boolean)
    .slice(0, 4)
    .map((line) => {
      let ids = [101, ...encodeWordPiece(line, vocab).tokens.map((t) => t.id), 102];
      if (ids.length > maxLen) ids = [...ids.slice(0, maxLen - 1), 102];
      const pad = maxLen - ids.length;
      return { ids: [...ids, ...Array(pad).fill(0)], mask: [...ids.map(() => 1), ...Array(pad).fill(0)] };
    });
  return (
    <Panel title="Padding and attention masks (real BERT IDs)">
      <label className="block text-xs text-slate-400">
        Sentences (one per line)
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className={area} />
      </label>
      <div className="mt-2">
        <Slider label="Batch length (max tokens)" min={4} max={20} step={1} value={maxLen} onChange={setMaxLen} />
      </div>
      <div role="status" className="mt-3 space-y-2 overflow-x-auto font-mono text-[11px]">
        {rows.map((r, i) => (
          <div key={i}>
            <div className="flex gap-1">
              {r.ids.map((id, j) => (
                <span key={j} className={`w-10 shrink-0 rounded border text-center ${r.mask[j] ? "border-emerald-500/50 text-emerald-200" : "border-slate-800 text-slate-600"}`}>
                  {id}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400">Green = real tokens (mask 1); grey 0 = [PAD] (mask 0). Long rows are cut but keep [SEP] = 102 last.</p>
    </Panel>
  );
}
