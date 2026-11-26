/** Concept labs for Module 02, steps 9–10 (real tokenizers; quirks, cost and context). */
import { Tiktoken } from "js-tiktoken/lite";
import { useEffect, useState } from "react";
import { Panel, Slider } from "../../../../components/ui";
import { useRealTokenizer } from "../../useRealTokenizer";

const area = "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 font-mono text-sm text-slate-100";
const piece = (b: Uint8Array) => new TextDecoder().decode(b).replace(/ /g, "␣");

/* ------------------------------------------------------------------ numbers */

/** Lab: GPT-4o's real pieces for numbers, and how the chunks fall against place value. */
export function NumberChunksLab() {
  const [nums, setNums] = useState("1000\n10000\n1234567\n3.14159\n2026");
  const lines = nums.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 8);
  const tok = useRealTokenizer("o200k_base", lines.join("\n"));
  const enc = tok.encoder;
  return (
    <Panel title="How GPT-4o reads numbers">
      <label className="block text-xs text-slate-400">
        Numbers (one per line)
        <textarea value={nums} onChange={(e) => setNums(e.target.value)} rows={5} className={area} />
      </label>
      {enc ? (
        <table className="mt-3 w-full text-left text-sm">
          <caption className="sr-only">Number pieces</caption>
          <tbody>
            {lines.map((n) => {
              const ids = enc.encode(n);
              return (
                <tr key={n} className="border-t border-slate-800">
                  <td className="py-1 font-mono text-slate-100">{n}</td>
                  <td className="py-1 font-mono text-violet-200">{ids.map((id) => piece(enc.tokenBytes(id))).join(" | ")}</td>
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
      <p className="mt-2 text-xs text-slate-400">Digit runs are chunked in threes from the left, so the thousands digit lands in a different chunk for 1000 and 10000.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ glitch tokens */

let gpt2: Promise<Tiktoken> | null = null;
const loadGpt2 = () => (gpt2 ??= import("js-tiktoken/ranks/gpt2").then((m) => new Tiktoken(m.default)));

/** Lab: strings that were single tokens in GPT-2's vocabulary but rare in its models' training text. */
export function GlitchLab({ load = loadGpt2 }: { load?: () => Promise<Tiktoken> }) {
  const [g, setG] = useState<Tiktoken | null>(null);
  const [text, setText] = useState(" SolidGoldMagikarp");
  const o = useRealTokenizer("o200k_base", text);
  useEffect(() => {
    let live = true;
    void load().then((e) => live && setG(e));
    return () => {
      live = false;
    };
  }, [load]);
  const gIds = g ? g.encode(text) : [];
  return (
    <Panel title="Glitch tokens">
      <label className="block text-xs text-slate-400">
        String (keep the leading space)
        <input value={text} onChange={(e) => setText(e.target.value)} className={area} />
      </label>
      {g && o.encoder ? (
        <dl className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg border border-slate-800 p-2">
            <dt className="text-xs text-slate-500">GPT-2 / GPT-3 vocabulary</dt>
            <dd role="status" className="font-mono text-lg text-slate-100">
              {gIds.length} token{gIds.length === 1 ? "" : "s"}
            </dd>
            <dd className="font-mono text-[11px] text-slate-400">{gIds.join(", ")}</dd>
          </div>
          <div className="rounded-lg border border-slate-800 p-2">
            <dt className="text-xs text-slate-500">GPT-4o vocabulary</dt>
            <dd className="font-mono text-lg text-slate-100">{o.encoder.encode(text).length} tokens</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-sm text-slate-400">Loading GPT-2&apos;s and GPT-4o&apos;s real tokenizers…</p>
      )}
      <p className="mt-2 text-xs text-slate-400">
        ` SolidGoldMagikarp`, ` petertodd` and ` davidjl` each got a single GPT-2 token, but were almost absent from the models&apos; training text, so their rows stayed nearly untrained. Newer tokenizers split them into ordinary pieces.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ chunking with overlap */

/** Lab: chunk a text's real GPT-4o tokens with overlap and see what repeats at the edges. */
export function ChunkerLab() {
  const [text, setText] = useState(
    "Our savings account pays 3% interest. Interest is added monthly. To open an account, visit a branch with ID. You can close the account online at any time, and the balance is moved to your current account within two days.",
  );
  const [size, setSize] = useState(16);
  const [overlap, setOverlap] = useState(4);
  const tok = useRealTokenizer("o200k_base", text);
  const enc = tok.encoder;
  const ids = enc ? enc.encode(text) : [];
  const ov = Math.min(overlap, size - 1);
  const chunks: number[][] = [];
  for (let start = 0; ids.length; start += size - ov) {
    chunks.push(ids.slice(start, start + size));
    if (start + size >= ids.length) break;
  }
  return (
    <Panel title="Chunking with overlap (real GPT-4o tokens)">
      <label className="block text-xs text-slate-400">
        Document
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className={area} />
      </label>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <Slider label="Chunk size (tokens)" min={4} max={64} step={1} value={size} onChange={setSize} />
        <Slider label="Overlap (tokens)" min={0} max={32} step={1} value={ov} onChange={setOverlap} />
      </div>
      {enc ? (
        <>
          <ol className="mt-3 space-y-1.5">
            {chunks.map((c, i) => (
              <li key={i} className="rounded-lg border border-slate-800 p-2 text-xs text-slate-200">
                <span className="mr-2 font-mono text-slate-500">#{i + 1}</span>
                {c.map((id, j) => (
                  <span key={j} className={i > 0 && j < ov ? "rounded bg-amber-500/20 text-amber-100" : ""}>
                    {new TextDecoder().decode(enc.tokenBytes(id))}
                  </span>
                ))}
              </li>
            ))}
          </ol>
          <p role="status" className="mt-2 text-sm text-slate-200">
            {ids.length} tokens → {chunks.length} chunks, {chunks.reduce((s, c) => s + c.length, 0)} tokens stored. Highlighted: the overlap repeated from the previous chunk.
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-400">Loading GPT-4o&apos;s real tokenizer…</p>
      )}
    </Panel>
  );
}
