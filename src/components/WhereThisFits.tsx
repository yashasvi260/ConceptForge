import { ChevronRight } from "lucide-react";

/** The LLM journey every module plugs into. */
export const JOURNEY: { label: string; modules: number[] }[] = [
  { label: "Text", modules: [1] },
  { label: "Tokens", modules: [1, 2] },
  { label: "Embeddings", modules: [1, 2] },
  { label: "Transformer", modules: [1, 3] },
  { label: "Next token", modules: [1, 3] },
  { label: "Use", modules: [4, 5, 6, 7, 8, 9] },
  { label: "Train", modules: [10, 11, 12] },
  { label: "Serve", modules: [13, 14] },
];

/** Compact strip showing where a module sits in the whole LLM picture. */
export function WhereThisFits({ moduleNumber, compact = false }: { moduleNumber: number; compact?: boolean }) {
  return (
    <nav aria-label="Where this fits" className={compact ? "" : "rounded-lg border border-slate-800 bg-slate-950/60 p-2"}>
      <ol className="flex flex-wrap items-center gap-y-1 text-[11px]">
        {JOURNEY.map((stage, i) => {
          const here = stage.modules.includes(moduleNumber);
          return (
            <li key={stage.label} className="flex items-center">
              <span
                aria-current={here ? "step" : undefined}
                className={`rounded px-1.5 py-0.5 ${here ? "bg-sky-500/20 font-semibold text-sky-100" : "text-slate-500"}`}
              >
                {stage.label}
              </span>
              {i < JOURNEY.length - 1 && <ChevronRight size={11} className="text-slate-700" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
