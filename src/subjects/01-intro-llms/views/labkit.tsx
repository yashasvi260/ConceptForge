/** Small shared pieces for Module 01's concept labs, so every lab looks and behaves the same way. */
import { useEffect, useState } from "react";
import type { GenTree } from "../generationLab";

export interface GenRecording {
  model: string;
  recordedAt: string;
  system: string;
  trees: GenTree[];
}

let cache: Promise<GenRecording> | null = null;
/** The real gemma4 recording (scripts/record-generation-tree.mjs), loaded once, on demand. */
export function loadGenRecording(): Promise<GenRecording> {
  cache ??= import("../data/generation-tree.json").then((m) => m.default as unknown as GenRecording);
  return cache;
}

export function useGenRecording(load: () => Promise<GenRecording> = loadGenRecording) {
  const [rec, setRec] = useState<GenRecording | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    load()
      .then((r) => live && setRec(r))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [load]);
  return { rec, failed };
}

/** Show a token's leading space (part of the token) and newlines. */
export const showToken = (t: string) => t.replace(/^ /, "␣").replace(/\n/g, "↵");
export const pct = (p: number) => (p >= 0.001 ? `${(p * 100).toFixed(1)}%` : "<0.1%");

/** The node reached by following a path of tokens from the root, or null if the recording never went there. */
export function nodeAt(tree: GenTree, path: string[]): number | null {
  let i = 0;
  for (const t of path) {
    const next = tree.nodes[i]?.children[t];
    if (next === undefined) return null;
    i = next;
  }
  return i;
}

export interface BarItem {
  label: string;
  value: number;
  highlight?: boolean;
  muted?: boolean;
  note?: string;
}

/** A labelled horizontal bar list; values are 0–1 and shown as percentages. */
export function ProbBars({ items, label, format = pct }: { items: BarItem[]; label: string; format?: (v: number) => string }) {
  return (
    <ul aria-label={label} className="space-y-1.5">
      {items.map((b) => (
        <li
          key={b.label}
          className={`grid grid-cols-[minmax(0,7rem)_1fr_3.75rem] items-center gap-2 rounded-lg border px-2 py-1.5 ${
            b.highlight ? "border-emerald-500 bg-emerald-500/10" : "border-slate-800"
          } ${b.muted ? "opacity-50" : ""}`}
        >
          <span className="truncate font-mono text-sm text-slate-100" title={b.note}>
            {b.label}
          </span>
          <span className="h-2 overflow-hidden rounded-full bg-slate-800">
            <span className="block h-full rounded-full bg-violet-500" style={{ width: `${Math.max(1, Math.min(1, b.value) * 100)}%` }} />
          </span>
          <span className="text-right font-mono text-xs text-slate-300">{format(b.value)}</span>
        </li>
      ))}
    </ul>
  );
}

/** "Real data" source line shown under labs that use recorded model output. */
export function RecordedNote({ rec }: { rec: GenRecording }) {
  return (
    <p className="mt-2 text-[11px] text-slate-500">
      Real next-token probabilities from {rec.model}, recorded {rec.recordedAt}.
    </p>
  );
}
