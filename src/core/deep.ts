import type { DeepLesson } from "./types";

/** Word ranges for the depth standard (spec: why ≈200–400, concept ≈800–1,500; with some slack). */
export const DEPTH = { why: [150, 450], concept: [700, 1700] } as const;

export function wordCount(paragraphs: string[]): number {
  return paragraphs.reduce((n, p) => n + p.split(/\s+/).filter(Boolean).length, 0);
}

/** Problems with a deep lesson against the depth standard; empty means it passes. */
export function validateDeep(d: DeepLesson): string[] {
  const out: string[] = [];
  const range = (name: string, n: number, [lo, hi]: readonly [number, number]) => {
    if (n < lo || n > hi) out.push(`${name}: ${n} words (want ${lo}–${hi})`);
  };
  range("why", wordCount(d.why), DEPTH.why);
  const conceptText = d.concept.flatMap((c) => [...c.paragraphs, c.mistake ?? ""]);
  range("concept", wordCount(conceptText), DEPTH.concept);
  if (!d.concept.some((c) => c.mistake?.trim())) out.push("concept: no common mistake");
  if (!d.worked.some((w) => w.kind === "table")) out.push("worked: no table");
  if (d.checks.length < 2 || d.checks.length > 3) out.push(`checks: ${d.checks.length} (want 2–3)`);
  if (!d.oneSentence.trim()) out.push("oneSentence: empty");
  if (!d.guided.trim()) out.push("guided: empty");
  if (d.deeper.length < 1 || d.deeper.length > 3) out.push(`deeper: ${d.deeper.length} (want 1–3)`);
  for (const s of d.deeper) if (!s.url.startsWith("https://")) out.push(`deeper: not https: ${s.url}`);
  if (d.build.parts.length === 0) out.push("build: no parts");
  for (const p of d.build.parts) {
    if (!/def check_\w+\s*\(/.test(p.checks)) out.push(`part ${p.id}: no checks`);
  }
  return out;
}
