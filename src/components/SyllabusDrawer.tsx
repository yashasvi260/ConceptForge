import { X } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent } from "react";
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
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Give focus back to whatever opened the drawer (the ☰ button) when it closes.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.querySelector<HTMLElement>('[aria-label="Close syllabus"]')?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, [open]);

  if (!open) return null;

  /** Keep Tab / Shift+Tab inside the dialog while it is open. */
  const trapTab = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusable = [...panelRef.current.querySelectorAll<HTMLElement>("button:not([disabled])")];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <div data-testid="drawer-backdrop" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm" />
      <aside
        ref={panelRef}
        onKeyDown={trapTab}
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
