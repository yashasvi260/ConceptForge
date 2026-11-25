import { ArrowRight, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel, Slider } from "../../../components/ui";
import { encodeBpe, trainBpe } from "../bpe";
import { TextBox, TokenChip } from "./common";
import { MAX_MERGES } from "./BpeTrainView";

export function BpeEncodeView({ corpus }: { corpus: string }) {
  const [word, setWord] = useState("lowest");
  const { merges } = useMemo(() => trainBpe(corpus, MAX_MERGES), [corpus]);
  const [use, setUse] = useState(Math.min(10, MAX_MERGES));
  const active = merges.slice(0, use);
  const first = word.trim().split(/\s+/)[0] ?? "";
  const { tokens, trace } = encodeBpe(first, active);

  return (
    <>
      <Panel title="Tokenize a word with the merges learned in step 4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextBox label="Word to tokenize" value={word} onChange={setWord} rows={1} maxLength={60} />
          <Slider
            label="Merges to use (in learned order)"
            value={Math.min(use, merges.length)}
            min={0}
            max={Math.max(1, merges.length)}
            onChange={setUse}
          />
        </div>
        <ol className="mt-3 flex flex-wrap gap-1.5">
          {active.map((m, i) => (
            <li key={i} className={`rounded px-2 py-0.5 font-mono text-xs ${trace.some((t) => t.merge === m) ? "bg-sky-500/20 text-sky-100" : "bg-slate-800 text-slate-500"}`}>
              {i + 1}. {m.pair[0]}+{m.pair[1]}
            </li>
          ))}
        </ol>
      </Panel>
      <Panel title="Merge by merge" icon={<Wand2 size={14} />}>
        {first ? (
          <>
            <div className="mb-2 flex flex-wrap items-center gap-1">
              <span className="w-24 text-xs text-slate-500">start</span>
              {[...Array.from(first), "</w>"].map((s, i) => (
                <TokenChip key={i} index={i} text={s} />
              ))}
            </div>
            <ol className="space-y-1.5" data-testid="bpe-trace">
              {trace.map((t, i) => (
                <li key={i} className="flex flex-wrap items-center gap-1">
                  <span className="w-24 font-mono text-xs text-sky-300">
                    {t.merge.pair[0]}+{t.merge.pair[1]}
                  </span>
                  <ArrowRight size={13} className="text-slate-600" />
                  {t.after.map((s, j) => (
                    <TokenChip key={j} index={j} text={s} />
                  ))}
                </li>
              ))}
            </ol>
            {trace.length === 0 && <p className="text-sm text-slate-500">No learned merge applies: the word stays as single characters.</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="bpe-result">
              <span className="text-sm text-slate-400">Result:</span>
              {tokens.map((s, i) => (
                <TokenChip key={i} index={i} text={s} />
              ))}
              <span className="font-mono text-xs text-slate-500">({tokens.length} tokens)</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">Type a word above.</p>
        )}
      </Panel>
    </>
  );
}
