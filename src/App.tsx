import { useCallback, useEffect, useMemo, useState } from "react";
import { ChallengeRunner } from "./components/ChallengeRunner";
import { ComingSoon } from "./components/ComingSoon";
import { SplitWorkspace } from "./components/SplitWorkspace";
import { StepControls } from "./components/StepControls";
import { TopNav } from "./components/TopNav";
import { defaultSubject, getSubject, listSubjects } from "./core/registry";
import { clampStep, formatHash, parseHash } from "./core/route";
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

export const AUTOPLAY_MS = 7000;

interface Location {
  subjectId: string;
  stepIndex: number;
  mode: PlayerMode;
}

function initialLocation(progress: ProgressMap): Location {
  const route = parseHash(window.location.hash);
  const fromHash = getSubject(route.subjectId);
  const subject = fromHash ?? getSubject(loadLastSubject()) ?? defaultSubject();
  const saved = getProgress(progress, subject.id).lastStep;
  // A step number in the hash only applies to the subject it names.
  const stepIndex = fromHash && route.stepIndex !== null ? route.stepIndex : saved;
  return {
    subjectId: subject.id,
    stepIndex: clampStep(stepIndex, subject.steps.length),
    mode: fromHash ? route.mode : "lesson",
  };
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
  const isBuilt = useCallback((id: string) => getSubject(id) !== undefined, []);

  const subject = getSubject(loc.subjectId) ?? defaultSubject();
  const step = subject.steps[clampStep(loc.stepIndex, subject.steps.length)]!;
  const subjectProgress = getProgress(progress, subject.id);

  // Persist progress whenever it changes.
  useEffect(() => saveProgress(progress), [progress]);

  // Record the viewed step.
  useEffect(() => {
    if (loc.mode !== "lesson") return;
    setProgress((p) => withStepVisited(p, subject.id, loc.stepIndex, step.id));
  }, [subject.id, loc.stepIndex, loc.mode, step.id]);

  // Mirror location in the URL hash, and follow back/forward navigation.
  useEffect(() => {
    if (comingSoon) return; // keep the coming-soon module's link in the address bar
    const hash = formatHash(subject.id, loc.mode, loc.stepIndex);
    if (window.location.hash !== hash) window.history.replaceState(null, "", hash);
    saveLastSubject(subject.id);
  }, [subject.id, loc.mode, loc.stepIndex, comingSoon]);

  useEffect(() => {
    const onHash = () => {
      const unbuilt = unbuiltFromHash(window.location.hash);
      if (unbuilt) {
        setComingSoon(unbuilt);
        return;
      }
      const route = parseHash(window.location.hash);
      const s = getSubject(route.subjectId);
      if (!s) return;
      setComingSoon(null);
      setLoc({
        subjectId: s.id,
        mode: route.mode,
        stepIndex: clampStep(route.stepIndex ?? 0, s.steps.length),
      });
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

  const selectSubject = useCallback(
    (id: string) => {
      const s = getSubject(id);
      if (!s) return;
      setAutoPlay(false);
      setComingSoon(null);
      setLoc((l) => ({
        subjectId: s.id,
        mode: l.mode,
        stepIndex: clampStep(getProgress(progress, s.id).lastStep, s.steps.length),
      }));
    },
    [progress],
  );

  const openModule = useCallback(
    (id: string) => {
      const s = getSubject(id);
      if (!s) return;
      setAutoPlay(false);
      setComingSoon(null);
      setLoc({ subjectId: s.id, mode: "lesson", stepIndex: 0 });
      window.scrollTo?.(0, 0);
    },
    [],
  );

  const setMode = useCallback((mode: PlayerMode) => {
    setComingSoon(null);
    setAutoPlay(false);
    setLoc((l) => ({ ...l, mode }));
  }, []);

  // Auto-Play advances one step per interval and stops on the last step.
  useEffect(() => {
    if (!autoPlay || loc.mode !== "lesson") return;
    if (loc.stepIndex >= subject.steps.length - 1) {
      setAutoPlay(false);
      return;
    }
    const t = window.setTimeout(() => goToStep(loc.stepIndex + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [autoPlay, loc.mode, loc.stepIndex, subject.steps.length, goToStep]);

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
  useKeyboardShortcuts(loc.mode === "lesson" && !comingSoon, handlers);

  const Stage = subject.Stage;

  return (
    <div className="flex min-h-full flex-col">
      <TopNav
        subjects={subjects}
        activeId={subject.id}
        mode={loc.mode}
        progress={progress}
        onSelectSubject={selectSubject}
        onModeChange={setMode}
      />

      {comingSoon ? (
        <ComingSoon entry={comingSoon} />
      ) : loc.mode === "lesson" ? (
        <>
          <SplitWorkspace
            subject={subject}
            step={step}
            stepIndex={loc.stepIndex}
            total={subject.steps.length}
            isBuilt={isBuilt}
            onOpenModule={openModule}
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
            />
          </div>
        </>
      ) : (
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
      )}
    </div>
  );
}
