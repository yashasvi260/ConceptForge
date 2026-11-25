import { ArrowRight, Clock } from "lucide-react";
import { courseSummary, moduleStatus, partSummary, resumeTarget, type ModuleStatus } from "../core/courseProgress";
import type { ProgressMap } from "../core/storage";
import { COURSE, trackGroups, type TrackEntry } from "../core/track";
import type { SubjectModule } from "../core/types";

interface CourseOverviewProps {
  subjects: readonly SubjectModule[];
  progress: ProgressMap;
  onOpenModule: (id: string) => void;
}

export const num2 = (n: number) => String(n).padStart(2, "0");

function statusLabel(status: ModuleStatus, isUpNext: boolean): string {
  switch (status.kind) {
    case "complete":
      return "✓ Completed";
    case "in-progress":
      return isUpNext && status.seen === 0 ? "▶ Up next" : `${status.seen}/${status.total} steps`;
    case "not-started":
      return isUpNext ? "▶ Up next" : `${status.total} steps`;
    case "coming-soon":
      return "Coming soon";
  }
}

function Tags({ entry }: { entry: TrackEntry }) {
  return (
    <div className="flex flex-wrap gap-1">
      {entry.tags.map((t) => (
        <span key={t} className="rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
          {t}
        </span>
      ))}
    </div>
  );
}

/** Home page: the whole syllabus, how much of it is done, and where to pick up. */
export function CourseOverview({ subjects, progress, onOpenModule }: CourseOverviewProps) {
  const summary = courseSummary(subjects, progress);
  const resume = resumeTarget(subjects, progress);
  const upNextId = resume?.entry.id;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-cyan-400">Course</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{COURSE.title}</h1>
            <p className="text-sm leading-relaxed text-slate-300">{COURSE.description}</p>
          </div>
          <div className="shrink-0 space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:w-80">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400">Course completion</span>
              <span className="font-bold text-emerald-400">
                {summary.completed} / {summary.total} modules · {summary.percent}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Course completion"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={summary.percent}
              className="h-2 w-full overflow-hidden rounded-full bg-slate-900"
            >
              <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all" style={{ width: `${summary.percent}%` }} />
            </div>
            {resume?.built && (
              <button
                type="button"
                onClick={() => onOpenModule(resume.entry.id)}
                className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 sm:text-sm"
              >
                {summary.completed === 0 && resume.entry.moduleNumber === 1 && !progress[resume.entry.id]
                  ? "Start Module 01 →"
                  : `Resume: ${num2(resume.entry.moduleNumber)}. ${resume.entry.title} →`}
              </button>
            )}
            {resume && !resume.built && (
              <p className="text-xs text-slate-400">
                All built modules done. Next: {num2(resume.entry.moduleNumber)}. {resume.entry.title} (coming soon).
              </p>
            )}
            {!resume && <p className="text-xs font-semibold text-emerald-300">Course complete!</p>}
          </div>
        </div>
      </section>

      {trackGroups(subjects).map((group) => {
        const part = partSummary(group.part, subjects, progress);
        return (
          <section
            key={group.part}
            aria-label={group.title}
            className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/85 p-5 shadow-xl sm:p-6"
          >
            <div className="flex flex-col justify-between gap-2 border-b border-slate-800 pb-3 sm:flex-row sm:items-center">
              <h2 className="text-base font-bold text-white sm:text-lg">{group.title}</h2>
              <span className="self-start rounded-full border border-slate-800 bg-slate-950 px-3 py-1 font-mono text-xs text-slate-300 sm:self-center">
                {part.completed} / {part.total} modules completed
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {group.modules.map(({ entry, subject }) => {
                const status = moduleStatus(subject, progress);
                const isUpNext = entry.id === upNextId && status.kind !== "complete" && subject !== undefined;
                const label = statusLabel(status, isUpNext);
                const head = (
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${
                        status.kind === "complete" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800 text-cyan-300"
                      }`}
                    >
                      Module {num2(entry.moduleNumber)}
                    </span>
                    <span
                      className={`font-mono text-xs ${
                        status.kind === "complete" ? "font-semibold text-emerald-400" : isUpNext ? "text-cyan-400" : "text-slate-500"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
                if (!subject) {
                  return (
                    <div key={entry.id} className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800/70 bg-slate-950/40 p-4 opacity-60">
                      <div>
                        {head}
                        <h3 className="text-sm font-bold text-slate-300 sm:text-base">{entry.title}</h3>
                      </div>
                      <Tags entry={entry} />
                    </div>
                  );
                }
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onOpenModule(entry.id)}
                    className={`group flex flex-col justify-between gap-4 rounded-xl border p-4 text-left transition-all ${
                      status.kind === "complete"
                        ? "border-emerald-500/35 bg-slate-950/90 hover:border-emerald-400"
                        : isUpNext
                          ? "border-cyan-500/50 bg-slate-950 ring-1 ring-cyan-500/20 hover:border-cyan-400"
                          : "border-slate-800 bg-slate-950/70 hover:border-slate-600"
                    }`}
                  >
                    <div>
                      {head}
                      <h3 className="text-sm font-bold text-white transition group-hover:text-cyan-300 sm:text-base">{entry.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">{subject.tagline}</p>
                    </div>
                    <div className="space-y-2.5">
                      <Tags entry={entry} />
                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          {subject.steps.length} steps · <Clock size={11} /> {subject.estimatedMinutes} min
                        </span>
                        <span className="flex items-center gap-1 text-cyan-400">
                          Open <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
