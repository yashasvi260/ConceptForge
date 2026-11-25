/** Course-level progress: module status, completion counts and where to resume. Pure functions. */
import { getProgress, type ProgressMap } from "./storage";
import { TRACK, type PartNumber, type TrackEntry } from "./track";
import type { SubjectModule } from "./types";

export type ModuleStatus =
  | { kind: "coming-soon" }
  | { kind: "not-started"; total: number }
  | { kind: "in-progress"; seen: number; total: number }
  | { kind: "complete"; total: number };

/** Complete = every current step viewed and the practice check attempted at least once. */
export function moduleStatus(subject: SubjectModule | undefined, progress: ProgressMap): ModuleStatus {
  if (!subject) return { kind: "coming-soon" };
  const p = getProgress(progress, subject.id);
  const total = subject.steps.length;
  // Only ids of steps that still exist count, so renamed steps never inflate progress.
  const seen = subject.steps.filter((s) => p.visitedSteps.includes(s.id)).length;
  if (seen === total && p.attempts > 0) return { kind: "complete", total };
  if (seen > 0 || p.attempts > 0) return { kind: "in-progress", seen, total };
  return { kind: "not-started", total };
}

function isComplete(entry: TrackEntry, subjects: readonly SubjectModule[], progress: ProgressMap): boolean {
  return moduleStatus(subjects.find((s) => s.id === entry.id), progress).kind === "complete";
}

/** Completed modules out of all modules in the track (unbuilt ones count in the total). */
export function courseSummary(
  subjects: readonly SubjectModule[],
  progress: ProgressMap,
): { completed: number; total: number; percent: number } {
  const completed = TRACK.filter((e) => isComplete(e, subjects, progress)).length;
  return { completed, total: TRACK.length, percent: Math.round((completed / TRACK.length) * 100) };
}

export function partSummary(
  part: PartNumber,
  subjects: readonly SubjectModule[],
  progress: ProgressMap,
): { completed: number; total: number } {
  const entries = TRACK.filter((e) => e.part === part);
  return { completed: entries.filter((e) => isComplete(e, subjects, progress)).length, total: entries.length };
}

/** The first built module not yet complete; else the first unbuilt one; null when everything is complete. */
export function resumeTarget(
  subjects: readonly SubjectModule[],
  progress: ProgressMap,
): { entry: TrackEntry; built: boolean } | null {
  const isBuilt = (e: TrackEntry) => subjects.some((s) => s.id === e.id);
  const builtNext = TRACK.find((e) => isBuilt(e) && !isComplete(e, subjects, progress));
  if (builtNext) return { entry: builtNext, built: true };
  const unbuilt = TRACK.find((e) => !isBuilt(e));
  return unbuilt ? { entry: unbuilt, built: false } : null;
}

/** "best correct / number of questions", e.g. "5/9". */
export function quizBadge(subject: SubjectModule, progress: ProgressMap): string {
  const best = getProgress(progress, subject.id).bestScore;
  return `${best ? best.correct : 0}/${subject.challenges.length}`;
}
