import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { ChallengeRunner } from "./components/ChallengeRunner";
import { ComingSoon } from "./components/ComingSoon";
import { CourseOverview } from "./components/CourseOverview";
import { SplitWorkspace } from "./components/SplitWorkspace";
import { StepControls } from "./components/StepControls";
import { SyllabusDrawer } from "./components/SyllabusDrawer";
import { UpNextCard } from "./components/UpNextCard";
import { courseSummary, quizBadge } from "./core/courseProgress";
import { defaultSubject, getSubject, listSubjects } from "./core/registry";
import { HOME_HASH, clampStep, formatHash, parseHash } from "./core/route";
import {
  getProgress,
  loadLastSubject,
  loadProgress,
  saveLastSubject,
  saveProgress,
  withChallengeResult,
  withStepVisited,
  type ProgressMap,
} from "./core/storage";
import { trackEntry, type TrackEntry } from "./core/track";
import type { PlayerMode } from "./core/types";
import { useKeyboardShortcuts } from "./core/useKeyboardShortcuts";
import { applyTheme, loadTheme, type Theme } from "./core/theme";

export const AUTOPLAY_MS = 7000;

type View = "course" | "module";

interface Location {
  view: View;
  /** The module shown in the player (kept while on the course page, for the last-visited module). */
  subjectId: string;
  stepIndex: number;
  mode: PlayerMode;
}

function locationFromHash(hash: string, progress: ProgressMap): Location | null {
  const route = parseHash(hash);
  const s = getSubject(route.subjectId);
  if (route.view === "course" || !s) return null;
  const stepIndex = route.stepIndex ?? getProgress(progress, s.id).lastStep;
  return { view: "module", subjectId: s.id, stepIndex: clampStep(stepIndex, s.steps.length), mode: route.mode };
}

function initialLocation(progress: ProgressMap): Location {
  const fromHash = locationFromHash(window.location.hash, progress);
  if (fromHash) return fromHash;
  const last = getSubject(loadLastSubject()) ?? defaultSubject();
  return { view: "course", subjectId: last.id, stepIndex: 0, mode: "lesson" };
}

/** A link to a curriculum module that isn't built yet. */
function unbuiltFromHash(hash: string): TrackEntry | null {
  const { subjectId } = parseHash(hash);
  if (!subjectId || getSubject(subjectId)) return null;
  return trackEntry(subjectId) ?? null;
}

export default function App() {
  const subjects = listSubjects();
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());
  const [loc, setLoc] = useState<Location>(() => initialLocation(progress));
  const [comingSoon, setComingSoon] = useState<TrackEntry | null>(() => unbuiltFromHash(window.location.hash));
  const [autoPlay, setAutoPlay] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  useEffect(() => applyTheme(theme), [theme]);
  const isBuilt = useCallback((id: string) => getSubject(id) !== undefined, []);
  // Latest location for the hashchange handler, which is registered once.
  const locRef = useRef(loc);
  locRef.current = loc;
  const comingSoonRef = useRef(comingSoon);
  comingSoonRef.current = comingSoon;

  const subject = getSubject(loc.subjectId) ?? defaultSubject();
  const step = subject.steps[clampStep(loc.stepIndex, subject.steps.length)]!;
  const subjectProgress = getProgress(progress, subject.id);
  const inPlayer = loc.view === "module" && !comingSoon;

  // Persist progress whenever it changes (the ref lets event handlers read the latest value).
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
    saveProgress(progress);
  }, [progress]);

  // Record the viewed step (only when the lesson is actually on screen).
  useEffect(() => {
    if (!inPlayer || loc.mode !== "lesson") return;
    setProgress((p) => withStepVisited(p, subject.id, loc.stepIndex, step.id));
  }, [inPlayer, subject.id, loc.stepIndex, loc.mode, step.id]);

  // Mirror the location in the URL hash. Changing page (course ↔ module, or module ↔ module) adds a
  // history entry so Back works; stepping inside a module replaces it so history isn't flooded.
  const lastPage = useRef<string | null>(null);
  useEffect(() => {
    if (comingSoon) return; // keep the coming-soon module's link in the address bar
    const page = loc.view === "course" ? "course" : subject.id;
    const hash = loc.view === "course" ? HOME_HASH : formatHash(subject.id, loc.mode, loc.stepIndex);
    if (window.location.hash !== hash) {
      if (lastPage.current !== null && lastPage.current !== page) window.history.pushState(null, "", hash);
      else window.history.replaceState(null, "", hash);
    }
    lastPage.current = page;
    if (loc.view === "module") saveLastSubject(subject.id);
  }, [loc.view, subject.id, loc.mode, loc.stepIndex, comingSoon]);

  useEffect(() => {
    const onHash = () => {
      const unbuilt = unbuiltFromHash(window.location.hash);
      const next = unbuilt ? null : locationFromHash(window.location.hash, progressRef.current);
      const cur = locRef.current;
      const same = unbuilt
        ? comingSoonRef.current?.id === unbuilt.id
        : !comingSoonRef.current &&
          (next
            ? cur.view === "module" && cur.subjectId === next.subjectId && cur.mode === next.mode && cur.stepIndex === next.stepIndex
            : cur.view === "course");
      if (same) return; // the hash already describes where we are (e.g. our own update echoed back)
      setAutoPlay(false);
      setDrawerOpen(false);
      if (unbuilt) {
        setComingSoon(unbuilt);
        return;
      }
      setComingSoon(null);
      setLoc((l) => next ?? { ...l, view: "course" });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      setLoc((l) => ({ ...l, mode: "lesson", stepIndex: clampStep(index, subject.steps.length) }));
    },
    [subject.steps.length],
  );

  const goHome = useCallback(() => {
    setAutoPlay(false);
    setDrawerOpen(false);
    setComingSoon(null);
    setLoc((l) => ({ ...l, view: "course" }));
    window.scrollTo?.(0, 0);
  }, []);

  /** Open a module where the learner left off (course page, Resume, syllabus). */
  const resumeModule = useCallback(
    (id: string) => {
      const s = getSubject(id);
      if (!s) return;
      setAutoPlay(false);
      setDrawerOpen(false);
      setComingSoon(null);
      setLoc({ view: "module", subjectId: s.id, mode: "lesson", stepIndex: clampStep(getProgress(progress, s.id).lastStep, s.steps.length) });
      window.scrollTo?.(0, 0);
    },
    [progress],
  );

  /** Open a module at its first step ("Next module", which hands off from the previous module). */
  const openModuleStart = useCallback((id: string) => {
    const s = getSubject(id);
    if (!s) return;
    setAutoPlay(false);
    setDrawerOpen(false);
    setComingSoon(null);
    setLoc({ view: "module", subjectId: s.id, mode: "lesson", stepIndex: 0 });
    window.scrollTo?.(0, 0);
  }, []);

  const setMode = useCallback((mode: PlayerMode) => {
    setAutoPlay(false);
    setLoc((l) => ({ ...l, mode }));
    window.scrollTo?.(0, 0);
  }, []);

  // Auto-Play advances one step per interval and stops on the last step.
  useEffect(() => {
    if (!autoPlay || !inPlayer || loc.mode !== "lesson") return;
    if (loc.stepIndex >= subject.steps.length - 1) {
      setAutoPlay(false);
      return;
    }
    const t = window.setTimeout(() => goToStep(loc.stepIndex + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [autoPlay, inPlayer, loc.mode, loc.stepIndex, subject.steps.length, goToStep]);

  const toggleAutoPlay = useCallback(() => {
    // Starting from the last step replays from the beginning.
    if (!autoPlay && loc.stepIndex >= subject.steps.length - 1) goToStep(0);
    setAutoPlay(!autoPlay);
  }, [autoPlay, loc.stepIndex, subject.steps.length, goToStep]);

  const handlers = useMemo(
    () => ({
      onPrev: () => {
        setAutoPlay(false);
        goToStep(loc.stepIndex - 1);
      },
      onNext: () => goToStep(loc.stepIndex + 1),
      onToggleAutoPlay: toggleAutoPlay,
    }),
    [goToStep, loc.stepIndex, toggleAutoPlay],
  );
  useKeyboardShortcuts(inPlayer && loc.mode === "lesson" && !drawerOpen, handlers);

  const Stage = subject.Stage;
  const upNext = <UpNextCard subject={subject} isBuilt={isBuilt} onOpenModule={openModuleStart} onHome={goHome} />;
  const summary = courseSummary(subjects, progress);
  const crumbEntry = comingSoon ?? (loc.view === "module" ? subject : null);

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader
        crumb={crumbEntry ? { moduleNumber: crumbEntry.moduleNumber, title: crumbEntry.title } : null}
        tabs={inPlayer ? { mode: loc.mode, badge: quizBadge(subject, progress), onModeChange: setMode } : null}
        mastered={loc.view === "course" && !comingSoon ? { completed: summary.completed, total: summary.total } : null}
        onHome={goHome}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "cream" ? "dark" : "cream"))}
        onOpenSyllabus={() => {
          setAutoPlay(false);
          setDrawerOpen(true);
        }}
      />
      <SyllabusDrawer
        open={drawerOpen}
        subjects={subjects}
        progress={progress}
        activeId={inPlayer ? subject.id : null}
        onClose={() => setDrawerOpen(false)}
        onOpenModule={resumeModule}
        onHome={goHome}
      />

      {comingSoon ? (
        <ComingSoon entry={comingSoon} onHome={goHome} />
      ) : loc.view === "course" ? (
        <CourseOverview subjects={subjects} progress={progress} onOpenModule={resumeModule} />
      ) : loc.mode === "lesson" ? (
        <>
          <SplitWorkspace
            subject={subject}
            step={step}
            stepIndex={loc.stepIndex}
            total={subject.steps.length}
            isBuilt={isBuilt}
            onOpenModule={openModuleStart}
            footer={upNext}
          >
            {/* key: remount per subject so each subject's control state is independent */}
            <Stage key={subject.id} step={step} stepIndex={loc.stepIndex} />
          </SplitWorkspace>
          <div className="sticky bottom-0 z-10">
            <StepControls
              steps={subject.steps}
              index={loc.stepIndex}
              accent={subject.accent}
              autoPlay={autoPlay}
              autoPlayMs={AUTOPLAY_MS}
              visited={subjectProgress.visitedSteps}
              onChange={(i) => {
                if (i < loc.stepIndex) setAutoPlay(false);
                goToStep(i);
              }}
              onToggleAutoPlay={toggleAutoPlay}
              onFinishSteps={() => setMode("challenge")}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col">
          <ChallengeRunner
            key={subject.id}
            subject={subject}
            progress={subjectProgress}
            onFinish={(correct, total) => setProgress((p) => withChallengeResult(p, subject.id, correct, total))}
            onReviewStep={(stepId) => {
              const i = subject.steps.findIndex((s) => s.id === stepId);
              goToStep(i < 0 ? 0 : i);
            }}
          />
          <div className="mx-auto w-full max-w-2xl px-4 pb-10">{upNext}</div>
        </div>
      )}
    </div>
  );
}
