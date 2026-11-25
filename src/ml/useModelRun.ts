import { useEffect, useState } from "react";

export interface ModelRun<T> {
  /** Result for the current inputs, or null while computing (never a stale result for old inputs). */
  value: T | null;
  /** Set when running the model failed for the current inputs. */
  error: boolean;
}

/**
 * Run a model computation whenever `key` (a string identifying the inputs) changes. Results from
 * earlier inputs are never shown, and failures are reported instead of leaving the view waiting.
 * Pass `fn = null` when there is nothing to compute (model not loaded, empty input).
 */
export function useModelRun<T>(fn: (() => Promise<T>) | null, key: string): ModelRun<T> {
  const [state, setState] = useState<{ key: string; value: T | null; error: boolean } | null>(null);
  useEffect(() => {
    if (!fn) return;
    let alive = true;
    fn().then(
      (value) => alive && setState({ key, value, error: false }),
      () => alive && setState({ key, value: null, error: true }),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` identifies the inputs of `fn`
  }, [key, fn === null]);
  if (!fn || !state || state.key !== key) return { value: null, error: false };
  return { value: state.value, error: state.error };
}
