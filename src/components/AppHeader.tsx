import { BookOpen, Menu, Trophy } from "lucide-react";
import type { PlayerMode } from "../core/types";
import { COURSE } from "../core/track";
import { num2 } from "./CourseOverview";

interface AppHeaderProps {
  /** The module shown in the breadcrumb, or null on the course page. */
  crumb: { moduleNumber: number; title: string } | null;
  /** Guided Steps / Practice Check tabs, shown in the module player only. */
  tabs: { mode: PlayerMode; badge: string; onModeChange: (mode: PlayerMode) => void } | null;
  /** "Mastered x/14" pill, shown on the course page. */
  mastered: { completed: number; total: number } | null;
  onHome: () => void;
  onOpenSyllabus: () => void;
}

export function AppHeader({ crumb, tabs, mastered, onHome, onOpenSyllabus }: AppHeaderProps) {
  return (
    <header className="z-30 border-b border-slate-800/90 bg-slate-900/80 backdrop-blur-md lg:sticky lg:top-0">
      <div className="mx-auto flex min-h-16 max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenSyllabus}
            aria-label="Open syllabus"
            className="rounded-xl border border-slate-700 bg-slate-800/90 p-2 text-slate-200 transition hover:bg-slate-700"
          >
            <Menu size={16} />
          </button>
          <button type="button" onClick={onHome} aria-label="ConceptForge home" className="group flex shrink-0 items-center gap-2.5 text-left">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-slate-700 bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-emerald-500/20 transition group-hover:border-cyan-500/50">
              <svg className="h-5 w-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                <line x1="12" y1="22" x2="12" y2="15.5" />
                <polyline points="22 8.5 12 15.5 2 8.5" />
              </svg>
            </span>
            <span className="text-base font-extrabold tracking-tight text-white">
              Concept<span className="text-cyan-400">Forge</span>
            </span>
          </button>
          <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 truncate border-l border-slate-800 pl-3 text-xs text-slate-400 sm:flex">
            {crumb ? (
              <>
                <button type="button" onClick={onHome} className="transition hover:text-cyan-400">
                  {COURSE.title}
                </button>
                <span aria-hidden="true">/</span>
                <span className="truncate font-mono font-semibold text-cyan-300">
                  {num2(crumb.moduleNumber)}. {crumb.title}
                </span>
              </>
            ) : (
              <span className="font-medium text-slate-300">{COURSE.title}</span>
            )}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {tabs && (
            <div role="tablist" aria-label="Mode" className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1">
              {(
                [
                  { value: "lesson", label: "Guided Steps", Icon: BookOpen },
                  { value: "challenge", label: "Practice Check", Icon: Trophy },
                ] as const
              ).map(({ value, label, Icon }) => {
                const selected = tabs.mode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => tabs.onModeChange(value)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition ${
                      selected ? "bg-slate-800 font-semibold text-white" : "font-medium text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                    {value === "challenge" && " "}
                    {value === "challenge" && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-1.5 font-mono text-[10px] text-emerald-300">
                        {tabs.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {mastered && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 font-mono text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
              <span className="text-slate-300">
                Mastered {mastered.completed}/{mastered.total}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
