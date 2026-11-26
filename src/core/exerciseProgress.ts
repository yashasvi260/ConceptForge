/** Which exercise parts the learner has passed, kept beside (not inside) module progress. */
import type { Exercise } from "./types";

export const EXERCISE_KEY = "conceptforge:exercises:v1";

export type ExerciseProgress = Record<string, string[]>;

export function loadExerciseProgress(): ExerciseProgress {
  try {
    const raw = window.localStorage.getItem(EXERCISE_KEY);
    if (!raw) return {};
    const v: unknown = JSON.parse(raw);
    if (typeof v !== "object" || v === null) return {};
    const out: ExerciseProgress = {};
    for (const [k, parts] of Object.entries(v)) {
      if (Array.isArray(parts)) out[k] = parts.filter((p): p is string => typeof p === "string");
    }
    return out;
  } catch {
    return {};
  }
}

export function markPartPassed(exerciseId: string, partId: string): ExerciseProgress {
  const prog = loadExerciseProgress();
  const parts = prog[exerciseId] ?? [];
  if (!parts.includes(partId)) prog[exerciseId] = [...parts, partId];
  try {
    window.localStorage.setItem(EXERCISE_KEY, JSON.stringify(prog));
  } catch {
    // Storage blocked: the mark lasts for this visit only.
  }
  return prog;
}

export function isExercisePassed(ex: Exercise, prog: ExerciseProgress): boolean {
  const done = prog[ex.id] ?? [];
  return ex.parts.length > 0 && ex.parts.every((p) => done.includes(p.id));
}
