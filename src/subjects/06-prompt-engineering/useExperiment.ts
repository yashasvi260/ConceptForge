import { useEffect, useState } from "react";
import type { RecordingFile } from "../../llm/recordings";

export type ModelChoice = "gemma" | "small";

export const MODELS: Record<ModelChoice, { name: string; label: string; load: () => Promise<{ default: unknown }> }> = {
  gemma: { name: "gemma4:12b", label: "gemma4:12b (12 B parameters)", load: () => import("./data/recordings/experiment.json") },
  small: { name: "qwen2.5-coder:1.5b", label: "qwen2.5-coder:1.5b (1.5 B)", load: () => import("./data/recordings/experiment-small.json") },
};

const cache: Partial<Record<ModelChoice, RecordingFile>> = {};

/** 512 recorded runs per model (a few MB), loaded only when Module 06 needs them. */
export function useExperiment(model: ModelChoice = "gemma"): RecordingFile | null {
  const [, force] = useState(0);
  useEffect(() => {
    if (cache[model]) return;
    let alive = true;
    void MODELS[model].load().then((m) => {
      cache[model] = m.default as RecordingFile;
      if (alive) force((n) => n + 1);
    });
    return () => {
      alive = false;
    };
  }, [model]);
  return cache[model] ?? null;
}

export const emptyFile = (model: ModelChoice): RecordingFile => ({ model: MODELS[model].name, ollamaVersion: "", recordedAt: "", options: {}, items: [] });
