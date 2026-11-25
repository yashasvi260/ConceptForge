import { ArrowRight, Link2 } from "lucide-react";
import { RichText } from "./ui";
import { moduleLabel, nextModule } from "../core/track";
import type { SubjectModule } from "../core/types";

interface BridgeCardProps {
  kind: "buildsOn" | "upNext";
  subject: SubjectModule;
  /** Whether the next module is playable yet. */
  isBuilt: (id: string) => boolean;
  onOpenModule: (id: string) => void;
}

export function BridgeCard({ kind, subject, isBuilt, onOpenModule }: BridgeCardProps) {
  if (kind === "buildsOn") {
    return (
      <div role="note" aria-label="Builds on" className="mt-4 flex gap-2 rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-300">
        <Link2 size={15} className="mt-0.5 shrink-0 text-slate-400" />
        <span>
          <span className="font-semibold text-slate-200">Builds on: </span>
          <RichText text={subject.bridge.buildsOn} />
        </span>
      </div>
    );
  }
  const next = nextModule(subject.id);
  return (
    <div role="note" aria-label="Up next" className="mt-4 rounded-lg border border-emerald-600/40 bg-emerald-500/10 p-3 text-sm text-slate-200">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">Up next</p>
      <p className="mt-1">
        <RichText text={subject.bridge.leadsTo} />
      </p>
      {next ? (
        isBuilt(next.id) ? (
          <button
            type="button"
            onClick={() => onOpenModule(next.id)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-medium text-slate-950 hover:bg-emerald-400"
          >
            Go to {moduleLabel(next.moduleNumber)}: {next.title} <ArrowRight size={13} />
          </button>
        ) : (
          <p className="mt-2 text-xs text-slate-400">
            {moduleLabel(next.moduleNumber)}: {next.title} (coming soon)
          </p>
        )
      ) : (
        <p className="mt-2 text-xs text-slate-400">This is the last module of the track.</p>
      )}
    </div>
  );
}
