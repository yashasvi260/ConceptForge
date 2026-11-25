import { Trophy } from "lucide-react";
import { useState } from "react";
import { Bar, Panel } from "../../../components/ui";
import { normalize, relativeProbabilities, topSegmentations } from "../unigram";
import { TextBox, TokenChip } from "./common";

export function UnigramView() {
  const [text, setText] = useState("hello world");
  const top = topSegmentations(text, 3);
  const probs = relativeProbabilities(top);
  const restored = top[0] ? top[0].pieces.join("").replace(/▁/g, " ").trim() : "";

  return (
    <>
      <Panel title="SentencePiece view of your text">
        <TextBox label="Text to segment" value={text} onChange={setText} rows={1} maxLength={80} />
        <p className="mt-3 font-mono text-sm text-slate-300">
          normalised: <span className="text-sky-200">{normalize(text) || "∅"}</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">Spaces become ▁ (U+2581), so joining the pieces gives the text back exactly.</p>
      </Panel>
      <Panel title="Top segmentations (Viterbi picks the most probable)" icon={<Trophy size={14} />}>
        {top.length === 0 ? (
          <p className="text-sm text-slate-500">Type some text above.</p>
        ) : (
          <ol className="space-y-3" data-testid="segmentations">
            {top.map((seg, i) => (
              <li key={i} className={`rounded-lg border p-3 ${i === 0 ? "border-sky-500/50 bg-sky-500/5" : "border-slate-800"}`}>
                <div className="mb-2 flex flex-wrap items-center gap-1">
                  {i === 0 && <span className="mr-1 rounded bg-sky-500 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-950">best</span>}
                  {seg.pieces.map((p, j) => (
                    <TokenChip key={j} index={j} text={p} />
                  ))}
                </div>
                <Bar label={`log p ${seg.logProb.toFixed(1)}`} value={probs[i] ?? 0} display={`${((probs[i] ?? 0) * 100).toFixed(1)}%`} />
              </li>
            ))}
          </ol>
        )}
        {restored && (
          <p className="mt-3 text-xs text-slate-500">
            Restored from the best pieces: <span className="font-mono text-slate-300">“{restored}”</span>
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Percentages compare these three candidates only. This mini vocabulary is illustrative; real SentencePiece models learn
          tens of thousands of pieces.
        </p>
      </Panel>
    </>
  );
}
