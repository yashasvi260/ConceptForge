import { ArrowRight, StepForward, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Panel } from "../../../components/ui";

const INPUT = ["The", "cat", "sleeps"];
const OUTPUT = ["Le", "chat", "dort"];

export function EncDecView() {
  const [n, setN] = useState(1);
  return (
    <>
      <Panel title="Translation with an encoder-decoder (illustrative example)">
        <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-lg border border-sky-500/40 bg-sky-500/5 p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-sky-300">Encoder · reads everything</div>
            <div className="mt-2 flex gap-1">
              {INPUT.map((t) => (
                <span key={t} className="rounded bg-sky-500/20 px-2 py-1 font-mono text-sm">
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">Every input token sees every other (bidirectional).</p>
          </div>
          <ArrowRight className="mx-auto text-slate-500" />
          <div className="rounded-lg border border-violet-500/40 bg-violet-500/5 p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-violet-300">Decoder · writes left to right</div>
            <div className="mt-2 flex gap-1" aria-label="Generated output">
              {OUTPUT.map((t, i) => (
                <span key={t} className={`rounded px-2 py-1 font-mono text-sm ${i < n ? "bg-violet-500/25" : "bg-slate-800 text-slate-600"}`}>
                  {i < n ? t : "…"}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Each new word sees the words already written (causal) and looks back at the whole input (cross-attention).
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setN((v) => Math.min(OUTPUT.length, v + 1))}
            disabled={n >= OUTPUT.length}
            className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-violet-400 disabled:opacity-40"
          >
            <StepForward size={15} /> Next token
          </button>
          <button type="button" onClick={() => setN(1)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200">
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </Panel>
      <Panel title="Where each family is used">
        <table className="w-full text-sm">
          <tbody>
            {[
              ["Encoder-only", "BERT", "classification, search, clustering (understanding)"],
              ["Decoder-only", "GPT, Llama", "chat, writing, code, most of today's LLMs (generation)"],
              ["Encoder-decoder", "T5, original Transformer", "translation, summarisation (input → separate output)"],
            ].map(([a, b, c]) => (
              <tr key={a} className="border-t border-slate-800">
                <td className="py-1.5 pr-3 font-semibold text-slate-200">{a}</td>
                <td className="py-1.5 pr-3 text-slate-400">{b}</td>
                <td className="py-1.5 text-slate-400">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
