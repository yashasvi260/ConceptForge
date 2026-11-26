import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Code2, Lightbulb, MousePointerClick, Quote } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
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
  /** The subject's interactive stage, shown in the practice panel's first tab. */
  children: ReactNode;
}

type PanelTab = "stage" | "build";
const TABS: { id: PanelTab; label: string }[] = [
  { id: "stage", label: "Interactive" },
  { id: "build", label: "Build it · Python" },
];

/** Below the two-column breakpoint the panel sits under the reading, so a prompt in the text scrolls to it. */
function revealOnSmallScreens(el: HTMLElement | null): void {
  if (!el || typeof window.matchMedia !== "function") return;
  if (window.matchMedia("(min-width: 1024px)").matches) return;
  el.scrollIntoView?.({ behavior: "smooth", block: "start" });
}

/**
 * Reading on the left (why → worked example → concept → build → check → summary), and a practice panel on the
 * right that stays in view while you read: the interactive stage, or the Python exercise. Stacked on small screens.
 */
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
  const ids = useId();
  const panelRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Partial<Record<PanelTab, HTMLButtonElement | null>>>({});
  // Each step opens on the interactive view.
  const [chosen, setChosen] = useState<{ step: string; tab: PanelTab }>({ step: step.id, tab: "stage" });
  const tab: PanelTab = chosen.step === step.id ? chosen.tab : "stage";
  const select = (t: PanelTab) => setChosen({ step: step.id, tab: t });
  const openFromReading = (t: PanelTab) => {
    select(t);
    revealOnSmallScreens(panelRef.current);
  };
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.id === tab);
    const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length]!.id;
    select(next);
    tabRefs.current[next]?.focus();
  };
  const passedCount = deep.build.parts.filter((p) => passedParts.includes(p.id)).length;
  const linkBtn = `inline-flex items-center gap-1 rounded-md border ${a.border} px-2.5 py-1 text-xs font-semibold ${a.text} transition hover:bg-slate-800`;

  return (
    <div className="mx-auto grid w-full max-w-[1500px] flex-1 gap-4 px-4 py-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <AnimatePresence mode="wait">
          <motion.article
            key={step.id}
            aria-label="Lesson"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-xl sm:p-7"
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
                <div className={`space-y-2 rounded-lg border ${a.border} ${a.softBg} p-3 text-sm text-slate-200`}>
                  <p className="flex gap-2">
                    <Lightbulb size={16} className={`mt-0.5 shrink-0 ${a.text}`} aria-hidden="true" />
                    <span>
                      <span className="font-semibold">Try it: </span>
                      <RichText text={deep.guided} />
                    </span>
                  </p>
                  <button type="button" onClick={() => openFromReading("stage")} className={linkBtn}>
                    Try it in the interactive view
                    <ArrowRight size={12} aria-hidden="true" />
                  </button>
                </div>
                {restParts.map((p) => (
                  <ConceptPartView key={p.heading} part={p} />
                ))}
              </div>
            </Section>

            <Section n={4} title="Build it">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-start gap-3">
                  <Code2 size={18} className={`mt-0.5 shrink-0 ${a.text}`} aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-white">{deep.build.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {passedCount} of {deep.build.parts.length} parts passed
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => openFromReading("build")} className={linkBtn}>
                  Open the exercise
                  <ArrowRight size={12} aria-hidden="true" />
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Write it yourself in real Python, right in the panel{" "}
                <span className="hidden lg:inline">on the right</span>
                <span className="lg:hidden">below</span>. Each part has checks, hints and a solution
                {deep.local.length > 0 ? ", and the panel ends with code to run the real thing on your own machine." : "."}
              </p>
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
        {footer}
      </div>

      <aside
        ref={panelRef}
        aria-label="Practice"
        className="min-w-0 scroll-mt-20 lg:sticky lg:top-[80px] lg:max-h-[calc(100vh-150px)] lg:self-start lg:overflow-y-auto lg:rounded-2xl"
      >
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl">
          <div role="tablist" aria-label="Practice" className="sticky top-0 z-10 flex gap-1 border-b border-slate-800 bg-slate-900 px-3 pt-2">
            {TABS.map((t) => {
              const on = t.id === tab;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[t.id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${ids}-tab-${t.id}`}
                  aria-selected={on}
                  aria-controls={`${ids}-panel-${t.id}`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => select(t.id)}
                  onKeyDown={onTabKey}
                  className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition ${
                    on ? `${a.text} border-current` : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t.id === "stage" ? <MousePointerClick size={13} aria-hidden="true" /> : <Code2 size={13} aria-hidden="true" />}
                  {t.label}
                  {t.id === "build" && passedCount > 0 && (
                    <span className="ml-1 rounded-full bg-emerald-500/15 px-1.5 text-[10px] text-emerald-300">
                      {passedCount}/{deep.build.parts.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Both panels stay mounted, so switching tabs keeps the stage's state and any code or run in progress. */}
          <div role="tabpanel" id={`${ids}-panel-stage`} aria-labelledby={`${ids}-tab-stage`} hidden={tab !== "stage"}>
            <section aria-label="Interactive stage" className="stage-grid p-3 sm:p-4">
              {children}
            </section>
          </div>
          <div
            role="tabpanel"
            id={`${ids}-panel-build`}
            aria-labelledby={`${ids}-tab-build`}
            hidden={tab !== "build"}
            className="space-y-6 p-4"
          >
            <CodeExercise key={deep.build.id} exercise={deep.build} data={data} passedParts={passedParts} onPartPassed={onPartPassed} />
            {deep.local.map((l) => (
              <LocalListingView key={`${deep.build.id}/${l.id}`} listing={l} />
            ))}
          </div>
        </div>
      </aside>
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
