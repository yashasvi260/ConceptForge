import { Hammer } from "lucide-react";
import { PART_TITLES, moduleLabel, type TrackEntry } from "../core/track";
import { WhereThisFits } from "./WhereThisFits";

export function ComingSoon({ entry }: { entry: TrackEntry }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <Hammer className="mx-auto text-slate-400" size={36} />
        <h2 className="mt-3 text-2xl font-semibold">Coming soon</h2>
        <p className="mt-2 text-slate-300">
          {moduleLabel(entry.moduleNumber)}: {entry.title}
        </p>
        <p className="mt-1 text-sm text-slate-500">{PART_TITLES[entry.part]}</p>
        <div className="mt-6 flex justify-center">
          <WhereThisFits moduleNumber={entry.moduleNumber} />
        </div>
        <p className="mt-6 text-sm text-slate-400">Pick a built module from the menu above to keep learning.</p>
      </div>
    </div>
  );
}
