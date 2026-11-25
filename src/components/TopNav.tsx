import { BookOpen, ChevronDown, Clock, Flame, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ACCENTS } from "../core/accent";
import { groupByCategory } from "../core/registry";
import type { ProgressMap } from "../core/storage";
import { getProgress } from "../core/storage";
import type { PlayerMode, SubjectModule } from "../core/types";

interface TopNavProps {
  subjects: readonly SubjectModule[];
  activeId: string;
  mode: PlayerMode;
  progress: ProgressMap;
  onSelectSubject: (id: string) => void;
  onModeChange: (mode: PlayerMode) => void;
}

function explored(subject: SubjectModule, progress: ProgressMap): number {
  const visited = getProgress(progress, subject.id).visitedSteps;
  const seen = subject.steps.filter((s) => visited.includes(s.id)).length;
  return Math.round((seen / subject.steps.length) * 100);
}

export function TopNav({ subjects, activeId, mode, progress, onSelectSubject, onModeChange }: TopNavProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = subjects.find((s) => s.id === activeId) ?? subjects[0]!;
  const ActiveIcon = active.icon;
  const accent = ACCENTS[active.accent];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <header className="z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur lg:sticky lg:top-0">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-violet-500 text-slate-950">
            <Flame size={18} strokeWidth={2.5} />
          </span>
          <span className="text-lg font-semibold tracking-tight">ConceptForge</span>
        </div>

        <div ref={rootRef} className="relative order-last w-full md:order-none md:w-auto md:flex-1">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`Choose a topic (current: ${active.title})`}
            onClick={() => setOpen((o) => !o)}
            className={`flex w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition md:w-auto ${accent.border} ${accent.softBg}`}
          >
            <ActiveIcon size={16} className={accent.text} />
            <span className="truncate text-slate-400">{active.category} ·</span>
            <span className="font-medium text-white">{active.title}</span>
            <ChevronDown size={15} className={`ml-auto text-slate-400 transition md:ml-1 ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div
              role="menu"
              aria-label="Topics"
              className="absolute left-0 top-full z-30 mt-2 w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl"
            >
              {groupByCategory(subjects).map((g) => (
                <div key={g.category} role="group" aria-label={g.category} className="py-1">
                  <div className="px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {g.category}
                  </div>
                  {g.subjects.map((s) => {
                    const Icon = s.icon;
                    const a = ACCENTS[s.accent];
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="menuitem"
                        aria-current={s.id === activeId ? "page" : undefined}
                        onClick={() => {
                          setOpen(false);
                          onSelectSubject(s.id);
                        }}
                        className={`flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-slate-800 ${
                          s.id === activeId ? "bg-slate-800/70" : ""
                        }`}
                      >
                        <Icon size={18} className={`mt-0.5 shrink-0 ${a.text}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-slate-100">{s.title}</span>
                          <span className="block truncate text-xs text-slate-500">{s.tagline}</span>
                          <span className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                            <span className="capitalize">{s.difficulty}</span>
                            <span className="flex items-center gap-1">
                              <Clock size={11} /> {s.estimatedMinutes} min
                            </span>
                            <span>{explored(s, progress)}% explored</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div role="tablist" aria-label="Mode" className="flex gap-1 rounded-lg bg-slate-900 p-1">
          {(
            [
              { value: "lesson", label: "Lesson", Icon: BookOpen },
              { value: "challenge", label: "Challenge", Icon: Trophy },
            ] as const
          ).map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => onModeChange(value)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-sm transition ${
                mode === value ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
