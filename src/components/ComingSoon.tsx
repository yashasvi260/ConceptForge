import { Hammer } from "lucide-react";
import { PART_TITLES, moduleLabel, type TrackEntry } from "../core/track";
import { WhereThisFits } from "./WhereThisFits";

export function ComingSoon({ entry, onHome }: { entry: TrackEntry; onHome: () => void }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-8 text-center shadow-xl">
        <Hammer className="mx-auto text-slate-400" size={36} />
        <h2 className="mt-3 text-2xl font-semibold">Coming soon</h2>
        <p className="mt-2 text-slate-300">
          {moduleLabel(entry.moduleNumber)}: {entry.title}
        </p>
        <p className="mt-1 text-sm text-slate-500">{PART_TITLES[entry.part]}</p>
        <div className="mt-6 flex justify-center">
          <WhereThisFits moduleNumber={entry.moduleNumber} />
        </div>
        <button
          type="button"
          onClick={onHome}
          className="mt-6 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Back to course overview
        </button>
      </div>
    </div>
  );
}
