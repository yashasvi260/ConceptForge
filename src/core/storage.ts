/** Progress persistence in localStorage. Every access is guarded: storage can be unavailable. */
import { LEGACY_IDS, resolveId } from "./track";

export interface SubjectProgress {
  /** Index of the step the learner last viewed. */
  lastStep: number;
  /** Ids of steps the learner has viewed at least once. */
  visitedSteps: string[];
  /** Best challenge result, or null if never attempted. */
  bestScore: { correct: number; total: number } | null;
  lastScore: { correct: number; total: number } | null;
  attempts: number;
}

export type ProgressMap = Record<string, SubjectProgress>;

export const PROGRESS_KEY = "conceptforge:progress:v1";
export const LAST_SUBJECT_KEY = "conceptforge:last-subject:v1";

export function emptyProgress(): SubjectProgress {
  return { lastStep: 0, visitedSteps: [], bestScore: null, lastScore: null, attempts: 0 };
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage full or blocked (private mode): progress just won't persist.
  }
}

function isScore(v: unknown): v is { correct: number; total: number } {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { correct?: unknown }).correct === "number" &&
    typeof (v as { total?: unknown }).total === "number"
  );
}

function sanitize(v: unknown): SubjectProgress {
  const base = emptyProgress();
  if (typeof v !== "object" || v === null) return base;
  const o = v as Record<string, unknown>;
  return {
    lastStep: typeof o.lastStep === "number" && o.lastStep >= 0 ? Math.floor(o.lastStep) : 0,
    visitedSteps: Array.isArray(o.visitedSteps)
      ? o.visitedSteps.filter((s): s is string => typeof s === "string")
      : [],
    bestScore: isScore(o.bestScore) ? o.bestScore : null,
    lastScore: isScore(o.lastScore) ? o.lastScore : null,
    attempts: typeof o.attempts === "number" ? o.attempts : 0,
  };
}

export function loadProgress(): ProgressMap {
  const raw = readRaw(PROGRESS_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: ProgressMap = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      const target = LEGACY_IDS[id] ?? id;
      // A legacy entry never overwrites progress already saved under the new id.
      if (target !== id && out[target]) continue;
      out[target] = sanitize(value);
    }
    return out;
  } catch {
    return {};
  }
}

export function saveProgress(map: ProgressMap): void {
  writeRaw(PROGRESS_KEY, JSON.stringify(map));
}

export function getProgress(map: ProgressMap, subjectId: string): SubjectProgress {
  return map[subjectId] ?? emptyProgress();
}

/** Pure update: record that a step was viewed. */
export function withStepVisited(
  map: ProgressMap,
  subjectId: string,
  stepIndex: number,
  stepId: string,
): ProgressMap {
  const prev = getProgress(map, subjectId);
  const visited = prev.visitedSteps.includes(stepId) ? prev.visitedSteps : [...prev.visitedSteps, stepId];
  if (prev.lastStep === stepIndex && visited === prev.visitedSteps) return map;
  return { ...map, [subjectId]: { ...prev, lastStep: stepIndex, visitedSteps: visited } };
}

/** Pure update: record a finished challenge run, keeping the best ratio. */
export function withChallengeResult(
  map: ProgressMap,
  subjectId: string,
  correct: number,
  total: number,
): ProgressMap {
  const prev = getProgress(map, subjectId);
  const score = { correct, total };
  const ratio = (s: { correct: number; total: number }) => (s.total === 0 ? 0 : s.correct / s.total);
  const best = prev.bestScore && ratio(prev.bestScore) >= ratio(score) ? prev.bestScore : score;
  return {
    ...map,
    [subjectId]: { ...prev, bestScore: best, lastScore: score, attempts: prev.attempts + 1 },
  };
}

export function withSubjectReset(map: ProgressMap, subjectId: string): ProgressMap {
  const next = { ...map };
  delete next[subjectId];
  return next;
}

export function loadLastSubject(): string | null {
  return resolveId(readRaw(LAST_SUBJECT_KEY));
}

export function saveLastSubject(id: string): void {
  writeRaw(LAST_SUBJECT_KEY, id);
}
