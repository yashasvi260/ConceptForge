import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, Quote } from "lucide-react";
import type { ReactNode } from "react";
import { ACCENTS } from "../../core/accent";
import { moduleLabel } from "../../core/track";
import type { DeepLesson, LessonStep, SubjectModule } from "../../core/types";
import { BridgeCard } from "../BridgeCard";
import { RichText } from "../ui";
import { WhereThisFits } from "../WhereThisFits";
import { CodeExercise } from "./CodeExercise";
import { ConceptPartView, GoDeeper, InlineChecks, LocalListingView, Prose, Section, WorkedExample } from "./sections";

interface DeepLessonPageProps {
  subject: SubjectModule;
  step: LessonStep;
  /** The step's loaded deep content. */
  lesson: DeepLesson;
  stepIndex: number;
  total: number;
  isBuilt: (id: string) => boolean;
  onOpenModule: (id: string) => void;
  /** Value injected into Python as DATA for this step's exercise. */
  data: unknown;
  passedParts: string[];
  onPartPassed: (partId: string) => void;
  footer?: ReactNode;
  /** The subject's interactive stage, shown inside "The concept". */
  children: ReactNode;
}

/** One scrolling lesson page: why → worked example → concept (+ stage) → build → check → summary. */
export function DeepLessonPage({
  subject,
  step,
  lesson,
  stepIndex,
  total,
  isBuilt,
  onOpenModule,
  data,
  passedParts,
  onPartPassed,
  footer,
  children,
}: DeepLessonPageProps) {
  const deep = lesson;
  const a = ACCENTS[subject.accent];
  const [firstPart, ...restParts] = deep.concept;
  return (
    <div className="mx-auto w-full max-w-[880px] flex-1 px-4 py-6">
      <AnimatePresence mode="wait">
        <motion.article
          key={step.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-8 rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-xl sm:p-8"
        >
          <header>
            <WhereThisFits moduleNumber={subject.moduleNumber} compact />
            <p className={`mt-3 text-xs font-semibold uppercase tracking-wider ${a.text}`}>
              {moduleLabel(subject.moduleNumber)} · {subject.title} · Step {stepIndex + 1} of {total}
            </p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-white">{step.title}</h2>
            <p className="mt-3 text-base text-slate-300">
              <RichText text={step.summary} />
            </p>
            {stepIndex === 0 && <BridgeCard kind="buildsOn" subject={subject} isBuilt={isBuilt} onOpenModule={onOpenModule} />}
          </header>

          <Section n={1} title="Why it exists">
            <Prose paragraphs={deep.why} />
          </Section>

          <Section n={2} title="Worked example">
            <WorkedExample blocks={deep.worked} />
          </Section>

          <Section n={3} title="The concept">
            <div className="space-y-10">
              {firstPart && <ConceptPartView part={firstPart} />}
              <div className="space-y-3">
                <div className={`flex gap-2 rounded-lg border ${a.border} ${a.softBg} p-3 text-sm text-slate-200`}>
                  <Lightbulb size={16} className={`mt-0.5 shrink-0 ${a.text}`} aria-hidden="true" />
                  <span>
                    <span className="font-semibold">Try it: </span>
                    <RichText text={deep.guided} />
                  </span>
                </div>
                <section aria-label="Interactive stage" className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                  <div className="stage-grid p-3 sm:p-4">{children}</div>
                </section>
              </div>
              {restParts.map((p) => (
                <ConceptPartView key={p.heading} part={p} />
              ))}
            </div>
          </Section>

          <Section n={4} title="Build it">
            <div className="space-y-6">
              <CodeExercise exercise={deep.build} data={data} passedParts={passedParts} onPartPassed={onPartPassed} />
              {deep.local.map((l) => (
                <LocalListingView key={l.id} listing={l} />
              ))}
            </div>
          </Section>

          <Section n={5} title="Check">
            <InlineChecks items={deep.checks} />
          </Section>

          <Section n={6} title="In one sentence">
            <blockquote className={`flex gap-3 rounded-xl border ${a.border} ${a.softBg} p-4 text-base font-medium text-slate-100`}>
              <Quote size={18} className={`mt-0.5 shrink-0 ${a.text}`} aria-hidden="true" />
              <RichText text={deep.oneSentence} />
            </blockquote>
            <GoDeeper links={deep.deeper} />
          </Section>

          {stepIndex === total - 1 && <BridgeCard kind="upNext" subject={subject} isBuilt={isBuilt} onOpenModule={onOpenModule} />}
        </motion.article>
      </AnimatePresence>
      {footer && <div className="mt-6">{footer}</div>}
    </div>
  );
}

/** Shown while a deep lesson's content downloads (or if it fails): the step's title and summary appear at once. */
export function DeepLessonLoading({
  subject,
  step,
  stepIndex,
  total,
  error,
  onRetry,
}: {
  subject: SubjectModule;
  step: LessonStep;
  stepIndex: number;
  total: number;
  error: boolean;
  onRetry: () => void;
}) {
  const a = ACCENTS[subject.accent];
  return (
    <div className="mx-auto w-full max-w-[880px] flex-1 px-4 py-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-xl sm:p-8">
        <p className={`text-xs font-semibold uppercase tracking-wider ${a.text}`}>
          {moduleLabel(subject.moduleNumber)} · {subject.title} · Step {stepIndex + 1} of {total}
        </p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-white">{step.title}</h2>
        <p className="mt-3 text-base text-slate-300">
          <RichText text={step.summary} />
        </p>
        {error ? (
          <div role="alert" className="mt-6 flex flex-wrap items-center gap-3 text-sm text-rose-300">
            Couldn't load this lesson. Check your connection.
            <button type="button" onClick={onRetry} className="rounded-md border border-rose-400/60 px-2.5 py-1 text-xs text-rose-100">
              Try again
            </button>
          </div>
        ) : (
          <p role="status" className="mt-6 text-sm text-slate-500">
            Loading lesson…
          </p>
        )}
      </div>
    </div>
  );
}
