import { Suspense, createElement, lazy, type ComponentType } from "react";
import type { StageProps } from "./types";

/**
 * A module's Stage, loaded only when the lesson is opened. Keeps big datasets (precomputed vectors,
 * recordings) and libraries (umap-js) out of the main bundle that every visitor downloads.
 */
export function lazyStage(load: () => Promise<{ Stage: ComponentType<StageProps> }>): ComponentType<StageProps> {
  const Lazy = lazy(() => load().then((m) => ({ default: m.Stage })));
  const fallback = createElement("p", { role: "status", className: "p-4 text-sm text-slate-500" }, "Loading lesson…");
  function LazyStage(props: StageProps) {
    return createElement(Suspense, { fallback }, createElement(Lazy, props));
  }
  return LazyStage;
}
