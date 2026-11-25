import { resolveId } from "./track";
import type { PlayerMode } from "./types";

/** Location inside the app, mirrored in the URL hash: `#/<subject>/<step>` or `#/<subject>/challenge`. */
export interface Route {
  subjectId: string | null;
  stepIndex: number | null;
  mode: PlayerMode;
}

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const subjectId = resolveId(parts[0] ?? null);
  const second = parts[1];
  if (second === "challenge") return { subjectId, stepIndex: null, mode: "challenge" };
  const n = second !== undefined ? Number.parseInt(second, 10) : Number.NaN;
  return { subjectId, stepIndex: Number.isFinite(n) && n >= 1 ? n - 1 : null, mode: "lesson" };
}

export function formatHash(subjectId: string, mode: PlayerMode, stepIndex: number): string {
  return mode === "challenge" ? `#/${subjectId}/challenge` : `#/${subjectId}/${stepIndex + 1}`;
}

export function clampStep(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(total - 1, index));
}
