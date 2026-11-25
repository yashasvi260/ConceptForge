import { nextModule } from "../core/track";
import type { SubjectModule } from "../core/types";
import { num2 } from "./CourseOverview";

interface UpNextCardProps {
  subject: SubjectModule;
  isBuilt: (id: string) => boolean;
  onOpenModule: (id: string) => void;
  onHome: () => void;
}

/** Footer card in the player: the next module in the syllabus, one click away. */
export function UpNextCard({ subject, isBuilt, onOpenModule, onHome }: UpNextCardProps) {
  const next = nextModule(subject.id);
  const built = next ? isBuilt(next.id) : false;
  return (
    <section
      aria-label="Up next in syllabus"
      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4"
    >
      <div className="min-w-0">
        <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">Up next in syllabus</span>
        <span className="block truncate text-xs font-bold text-white sm:text-sm">
          {next ? `${num2(next.moduleNumber)}. ${next.title}${built ? "" : " · coming soon"}` : "Course complete"}
        </span>
      </div>
      {next && built && (
        <button
          type="button"
          onClick={() => onOpenModule(next.id)}
          className="shrink-0 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-slate-700"
        >
          Next module →
        </button>
      )}
      {!next && (
        <button
          type="button"
          onClick={onHome}
          className="shrink-0 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-slate-700"
        >
          Course overview →
        </button>
      )}
    </section>
  );
}
