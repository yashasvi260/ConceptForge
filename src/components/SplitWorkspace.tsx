import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import type { ReactNode } from "react";
import { ACCENTS } from "../core/accent";
import { moduleLabel } from "../core/track";
import type { LessonStep, SubjectModule } from "../core/types";
import { BridgeCard } from "./BridgeCard";
import { RichText } from "./ui";
import { WhereThisFits } from "./WhereThisFits";

interface SplitWorkspaceProps {
  subject: SubjectModule;
  step: LessonStep;
  stepIndex: number;
  total: number;
  isBuilt: (id: string) => boolean;
  onOpenModule: (id: string) => void;
  /** Shown under the narrative (the "Up next in syllabus" card). */
  footer?: ReactNode;
  /** The subject's interactive stage. */
  children: ReactNode;
}

/** Narrative column on the left, interactive stage on the right (stacked on small screens). */
export function SplitWorkspace({ subject, step, stepIndex, total, isBuilt, onOpenModule, footer, children }: SplitWorkspaceProps) {
  const a = ACCENTS[subject.accent];
  return (
    <div className="mx-auto grid w-full max-w-[1500px] flex-1 gap-4 px-4 py-4 lg:grid-cols-[minmax(300px,380px)_1fr]">
      <aside className="flex flex-col gap-4 lg:sticky lg:top-[80px] lg:max-h-[calc(100vh-150px)] lg:self-start lg:overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.article
            key={step.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-xl"
          >
            <WhereThisFits moduleNumber={subject.moduleNumber} compact />
            <p className={`mt-3 text-xs font-semibold uppercase tracking-wider ${a.text}`}>
              {moduleLabel(subject.moduleNumber)} · {subject.title} · Step {stepIndex + 1} of {total}
              {step.section ? ` · ${step.section}` : ""}
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-white">{step.title}</h2>
            <p className="mt-2 text-sm font-medium text-slate-300">
              <RichText text={step.summary} />
            </p>
            {stepIndex === 0 && <BridgeCard kind="buildsOn" subject={subject} isBuilt={isBuilt} onOpenModule={onOpenModule} />}
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-400">
              {step.body.map((p, i) => (
                <p key={i}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
            {step.callout && (
              <div role="note" aria-label="Formula" className="mt-4 overflow-x-auto rounded-lg bg-slate-950 px-3 py-2 font-mono text-sm text-sky-200">
                {step.callout}
              </div>
            )}
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
            {stepIndex === total - 1 && <BridgeCard kind="upNext" subject={subject} isBuilt={isBuilt} onOpenModule={onOpenModule} />}
          </motion.article>
        </AnimatePresence>
        {footer}
      </aside>
      <main className="min-w-0" aria-label="Interactive stage">
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900 px-4 py-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" aria-hidden="true" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-200">
              Interactive stage · {subject.shortTitle}
            </span>
          </div>
          <div className="stage-grid p-3 sm:p-4">{children}</div>
        </div>
      </main>
    </div>
  );
}
