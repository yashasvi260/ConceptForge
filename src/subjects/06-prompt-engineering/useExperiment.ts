import { useCallback, useEffect, useState } from "react";
import type { RecordingFile } from "../../llm/recordings";

export type ModelChoice = "gemma" | "small";

type Loader = () => Promise<{ default: unknown }>;

export const MODELS: Record<ModelChoice, { name: string; label: string; load: Loader }> = {
  gemma: { name: "gemma4:12b", label: "gemma4:12b (12 B parameters)", load: () => import("./data/recordings/experiment.json") },
  small: { name: "qwen2.5-coder:1.5b", label: "qwen2.5-coder:1.5b (1.5 B)", load: () => import("./data/recordings/experiment-small.json") },
};

const cache: Partial<Record<ModelChoice, RecordingFile>> = {};

export interface ExperimentState {
  file: RecordingFile | null;
  error: boolean;
  retry: () => void;
}

/** 512 recorded runs per model (a few MB), loaded only when Module 06 needs them. */
export function useExperiment(model: ModelChoice = "gemma", load: Loader = MODELS[model].load): ExperimentState {
  const [, rerender] = useState(0);
  const [failed, setFailed] = useState<ModelChoice | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (cache[model]) return;
    let alive = true;
    setFailed(null);
    load().then(
      (m) => {
        cache[model] = m.default as RecordingFile;
        if (alive) rerender((n) => n + 1);
      },
      () => alive && setFailed(model),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `load` is fixed per model
  }, [model, attempt]);
  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return { file: cache[model] ?? null, error: failed === model && !cache[model], retry };
}

export const emptyFile = (model: ModelChoice): RecordingFile => ({ model: MODELS[model].name, ollamaVersion: "", recordedAt: "", options: {}, items: [] });
