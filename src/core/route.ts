import { resolveId } from "./track";
import type { PlayerMode } from "./types";

/**
 * Location inside the app, mirrored in the URL hash:
 * `#/` course overview · `#/<subject>/<step>` lesson · `#/<subject>/quiz` practice check
 * (`#/<subject>/challenge` is the older spelling and still works).
 */
export interface Route {
  view: "course" | "module";
  subjectId: string | null;
  stepIndex: number | null;
  mode: PlayerMode;
}

export const HOME_HASH = "#/";

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const subjectId = resolveId(parts[0] ?? null);
  if (!subjectId) return { view: "course", subjectId: null, stepIndex: null, mode: "lesson" };
  const second = parts[1];
  if (second === "quiz" || second === "challenge") return { view: "module", subjectId, stepIndex: null, mode: "challenge" };
  const n = second !== undefined ? Number.parseInt(second, 10) : Number.NaN;
  return { view: "module", subjectId, stepIndex: Number.isFinite(n) && n >= 1 ? n - 1 : null, mode: "lesson" };
}

export function formatHash(subjectId: string, mode: PlayerMode, stepIndex: number): string {
  return mode === "challenge" ? `#/${subjectId}/quiz` : `#/${subjectId}/${stepIndex + 1}`;
}

export function clampStep(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(total - 1, index));
}
