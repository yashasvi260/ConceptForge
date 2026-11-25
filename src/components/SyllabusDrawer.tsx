import { X } from "lucide-react";
import { useEffect } from "react";
import { moduleStatus } from "../core/courseProgress";
import type { ProgressMap } from "../core/storage";
import { COURSE, trackGroups } from "../core/track";
import type { SubjectModule } from "../core/types";
import { num2 } from "./CourseOverview";

interface SyllabusDrawerProps {
  open: boolean;
  subjects: readonly SubjectModule[];
  progress: ProgressMap;
  activeId: string | null;
  onClose: () => void;
  onOpenModule: (id: string) => void;
  onHome: () => void;
}

/** Side panel with every Part and module, so the learner can jump anywhere in the syllabus. */
export function SyllabusDrawer({ open, subjects, progress, activeId, onClose, onOpenModule, onHome }: SyllabusDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div data-testid="drawer-backdrop" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Course syllabus"
        className="fixed bottom-0 left-0 top-0 z-50 flex w-80 max-w-[85vw] flex-col border-r border-slate-800 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div className="min-w-0">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-cyan-400">Course syllabus</span>
            <h3 className="truncate text-sm font-bold text-white">{COURSE.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close syllabus"
            autoFocus
            className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-3">
          {trackGroups(subjects).map((g) => (
            <div key={g.part} role="group" aria-label={g.title} className="space-y-1.5">
              <div className="px-2 font-mono text-[11px] font-bold uppercase text-slate-400">{g.title}</div>
              <div className="space-y-1">
                {g.modules.map(({ entry, subject }) => {
                  const built = subject !== undefined;
                  const done = moduleStatus(subject, progress).kind === "complete";
                  const active = entry.id === activeId;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      disabled={!built}
                      aria-current={active ? "page" : undefined}
                      onClick={() => onOpenModule(entry.id)}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition ${
                        active
                          ? "border border-cyan-500/40 bg-cyan-500/15 font-semibold text-cyan-300"
                          : built
                            ? "text-slate-300 hover:bg-slate-800/80"
                            : "cursor-not-allowed text-slate-600"
                      }`}
                    >
                      <span className="truncate">
                        {num2(entry.moduleNumber)}. {entry.title}
                      </span>
                      <span className={`shrink-0 font-mono text-[11px] ${done ? "text-emerald-400" : "text-slate-600"}`}>
                        {built ? (done ? "✓" : "○") : "Coming soon"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-800 p-3">
          <button
            type="button"
            onClick={onHome}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            ← Course overview
          </button>
        </div>
      </aside>
    </>
  );
}
