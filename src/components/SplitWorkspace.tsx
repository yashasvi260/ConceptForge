import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import type { ReactNode } from "react";
import { ACCENTS } from "../core/accent";
import type { AccentColor, LessonStep } from "../core/types";
import { RichText } from "./ui";

interface SplitWorkspaceProps {
  step: LessonStep;
  stepIndex: number;
  total: number;
  accent: AccentColor;
  subjectTitle: string;
  /** The subject's interactive stage. */
  children: ReactNode;
}

/** Narrative column on the left, interactive stage on the right (stacked on small screens). */
export function SplitWorkspace({ step, stepIndex, total, accent, subjectTitle, children }: SplitWorkspaceProps) {
  const a = ACCENTS[accent];
  return (
    <div className="mx-auto grid w-full max-w-[1500px] flex-1 gap-4 px-4 py-4 lg:grid-cols-[minmax(300px,380px)_1fr]">
      <aside className="lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-150px)] lg:self-start lg:overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.article
            key={step.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
          >
            <p className={`text-xs font-semibold uppercase tracking-wider ${a.text}`}>
              {subjectTitle} · Step {stepIndex + 1} of {total}
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-white">{step.title}</h2>
            <p className="mt-2 text-sm font-medium text-slate-300">
              <RichText text={step.summary} />
            </p>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-400">
              {step.body.map((p, i) => (
                <p key={i}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
            {step.keyTakeaway && (
              <div
                role="note"
                aria-label="Key takeaway"
                className="mt-5 rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-200"
              >
                <span className={`block text-[11px] font-semibold uppercase tracking-wider ${a.text}`}>Key takeaway</span>
                <span className="mt-1 block">
                  <RichText text={step.keyTakeaway} />
                </span>
              </div>
            )}
            {step.tryIt && (
              <div className={`mt-5 flex gap-2 rounded-lg border ${a.border} ${a.softBg} p-3 text-sm text-slate-200`}>
                <Lightbulb size={16} className={`mt-0.5 shrink-0 ${a.text}`} />
                <span>
                  <span className="font-semibold">Try it: </span>
                  <RichText text={step.tryIt} />
                </span>
              </div>
            )}
          </motion.article>
        </AnimatePresence>
      </aside>
      <main className="min-w-0" aria-label="Interactive stage">
        {children}
      </main>
    </div>
  );
}
