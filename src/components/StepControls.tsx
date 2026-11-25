import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { MouseEvent } from "react";
import { ACCENTS } from "../core/accent";
import type { AccentColor, LessonStep } from "../core/types";

interface StepControlsProps {
  steps: LessonStep[];
  index: number;
  accent: AccentColor;
  autoPlay: boolean;
  autoPlayMs: number;
  visited: string[];
  onChange: (index: number) => void;
  onToggleAutoPlay: () => void;
  /** Called from the last step's "Take Practice Check" button. */
  onFinishSteps: () => void;
}

/** Consecutive steps that share a section, in order (one unnamed group when steps have no sections). */
function sectionsOf(steps: LessonStep[]): { name?: string; indexes: number[] }[] {
  const groups: { name?: string; indexes: number[] }[] = [];
  steps.forEach((s, i) => {
    const last = groups.at(-1);
    if (last && last.name === s.section) last.indexes.push(i);
    else groups.push({ name: s.section, indexes: [i] });
  });
  return groups;
}

/** Keep mouse clicks from moving focus onto the button, so Space stays an Auto-Play shortcut. */
const keepFocus = (e: MouseEvent) => e.preventDefault();

export function StepControls({
  steps,
  index,
  accent,
  autoPlay,
  autoPlayMs,
  visited,
  onChange,
  onToggleAutoPlay,
  onFinishSteps,
}: StepControlsProps) {
  const a = ACCENTS[accent];
  const atStart = index === 0;
  const atEnd = index === steps.length - 1;
  return (
    <div className="border-t border-slate-800 bg-slate-900/95 backdrop-blur-md">
      <div className="h-0.5 w-full bg-slate-900">
        {autoPlay && (
          <motion.div
            key={index}
            className={`h-full ${a.bg}`}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: autoPlayMs / 1000, ease: "linear" }}
          />
        )}
      </div>
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-4 py-2.5 sm:gap-3 sm:py-3">
        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={() => onChange(index - 1)}
          disabled={atStart}
          aria-label="Previous step"
          className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-700 disabled:opacity-40"
        >
          <ChevronLeft size={16} /> Prev
        </button>
        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={onToggleAutoPlay}
          aria-label={autoPlay ? "Pause auto-play" : "Start auto-play"}
          aria-pressed={autoPlay}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 font-mono text-xs text-slate-200 transition hover:bg-slate-700"
        >
          {autoPlay ? <Pause size={15} /> : <Play size={15} />}
          {autoPlay ? "Pause" : "Auto-Play"}
        </button>
{atEnd ? (
          <button
            type="button"
            onMouseDown={keepFocus}
            onClick={onFinishSteps}
            className="flex items-center gap-1 rounded-xl bg-cyan-500 px-3.5 py-1.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
          >
            Take Practice Check ✓
          </button>
        ) : (
          <button
            type="button"
            onMouseDown={keepFocus}
            onClick={() => onChange(index + 1)}
            aria-label="Next step"
            className="flex items-center gap-1 rounded-xl bg-cyan-500 px-3.5 py-1.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
          >
            Next <ChevronRight size={16} />
          </button>
        )}

        <div className="hidden flex-1 flex-wrap items-center gap-x-4 gap-y-1 sm:flex" aria-label="Lesson steps">
          {sectionsOf(steps).map((sec) => (
            <div key={sec.name ?? "all"} role="group" aria-label={sec.name ?? "Steps"} className="flex items-center gap-1.5">
              {sec.name && <span className="text-[10px] uppercase tracking-wider text-slate-600">{sec.name}</span>}
              {sec.indexes.map((i) => {
                const s = steps[i]!;
                const current = i === index;
                const seen = visited.includes(s.id);
                const filled = i <= index;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={keepFocus}
                    onClick={() => onChange(i)}
                    aria-label={`Go to step ${i + 1}: ${s.title}`}
                    aria-current={current ? "step" : undefined}
                    data-filled={filled ? "true" : "false"}
                    title={s.title}
                    className={`h-1.5 w-5 rounded-full transition-all ${
                      current
                        ? "bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.7)]"
                        : filled
                          ? "bg-cyan-500/80 hover:bg-cyan-400"
                          : seen
                            ? "bg-slate-600 hover:bg-slate-500"
                            : "bg-slate-800 hover:bg-slate-700"
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <span className="ml-auto font-mono text-xs text-slate-500 sm:ml-0">
          Step {index + 1} / {steps.length}
        </span>
        <span className="hidden text-xs text-slate-600 xl:inline">
          <kbd className="rounded bg-slate-800 px-1">←</kbd> <kbd className="rounded bg-slate-800 px-1">→</kbd> step ·{" "}
          <kbd className="rounded bg-slate-800 px-1">Space</kbd> auto-play
        </span>
      </div>
    </div>
  );
}
