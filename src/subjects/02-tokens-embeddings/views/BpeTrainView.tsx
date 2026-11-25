import { ChevronsRight, RotateCcw, StepForward } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, Panel } from "../../../components/ui";
import { trainBpe } from "../bpe";
import { TextBox, TokenChip } from "./common";

export const MAX_MERGES = 30;

export function BpeTrainView({ corpus, setCorpus }: { corpus: string; setCorpus: (c: string) => void }) {
  const [step, setStep] = useState(0);
  const { merges, snapshots } = useMemo(() => trainBpe(corpus, MAX_MERGES), [corpus]);
  const current = snapshots[Math.min(step, snapshots.length - 1)]!;
  const exhausted = step >= merges.length;
  const next = merges[step];
  const maxCount = current.pairCounts[0]?.count ?? 1;

  return (
    <>
      <Panel title="Training corpus">
        <TextBox
          label="Training corpus"
          value={corpus}
          rows={3}
          maxLength={4000}
          onChange={(v) => {
            setCorpus(v);
            setStep(0);
          }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(s + 1, merges.length))}
            disabled={exhausted}
            className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-40"
          >
            <StepForward size={15} /> Next merge
          </button>
          <button
            type="button"
            onClick={() => setStep(merges.length)}
            disabled={exhausted}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronsRight size={15} /> Run all ({merges.length})
          </button>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <span className="ml-auto font-mono text-sm text-slate-300" data-testid="merge-count">
            {step} {step === 1 ? "merge" : "merges"}
          </span>
        </div>
        {exhausted && (
          <p className="mt-2 text-sm text-amber-200" role="status">
            {merges.length === 0 ? "No pairs to merge in this corpus." : "No more pairs to merge: every word is now a single symbol (or the 30-merge limit was reached)."}
          </p>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Words as symbols (× frequency)">
          <ul className="space-y-1.5">
            {current.words.slice(0, 40).map((w, i) => (
              <li key={i} className="flex flex-wrap items-center gap-1">
                {w.symbols.map((s, j) => (
                  <TokenChip key={j} index={j} text={s} />
                ))}
                <span className="ml-1 font-mono text-xs text-slate-500">×{w.freq}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={next ? `Pair counts · next merge: ${next.pair[0]} + ${next.pair[1]}` : "Pair counts"}>
          <div className="space-y-1.5">
            {current.pairCounts.slice(0, 10).map((p, i) => (
              <Bar
                key={`${p.pair[0]}|${p.pair[1]}`}
                label={`${p.pair[0]} + ${p.pair[1]}`}
                value={p.count}
                max={maxCount}
                display={String(p.count)}
                color={i === 0 ? "#38bdf8" : "#475569"}
              />
            ))}
            {current.pairCounts.length === 0 && <p className="text-sm text-slate-500">No adjacent pairs left.</p>}
          </div>
        </Panel>
      </div>

      <Panel title={`Learned merges (vocabulary grows by one each time)`}>
        <ol className="flex flex-wrap gap-1.5" data-testid="learned-merges">
          {merges.slice(0, step).map((m, i) => (
            <li key={i} className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-200">
              {i + 1}. {m.pair[0]} + {m.pair[1]} → {m.merged}
            </li>
          ))}
          {step === 0 && <li className="text-sm text-slate-500">Nothing learned yet. Press Next merge.</li>}
        </ol>
      </Panel>
    </>
  );
}
