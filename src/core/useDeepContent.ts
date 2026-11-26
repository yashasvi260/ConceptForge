import { useCallback, useEffect, useState } from "react";
import type { DeepContent, SubjectModule } from "./types";

/** One load per subject per page visit, shared by every component that asks. */
const cache = new Map<string, Promise<DeepContent>>();

export function resetDeepCache(): void {
  cache.clear();
}

function load(subject: SubjectModule): Promise<DeepContent> {
  let p = cache.get(subject.id);
  if (!p) {
    if (!subject.loadDeep) return Promise.reject(new Error(`${subject.id} has deep steps but no loadDeep()`));
    p = subject.loadDeep();
    cache.set(subject.id, p);
    p.catch(() => cache.delete(subject.id)); // let a retry load again
  }
  return p;
}

export interface DeepState {
  content: DeepContent | null;
  error: boolean;
  retry: () => void;
}

/** The subject's deep lessons, loaded only when `wanted` (a deep step is on screen). */
export function useDeepContent(subject: SubjectModule, wanted: boolean): DeepState {
  const [state, setState] = useState<{ id: string; content: DeepContent | null; error: boolean }>({ id: subject.id, content: null, error: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!wanted) return;
    let live = true;
    load(subject).then(
      (content) => live && setState({ id: subject.id, content, error: false }),
      () => live && setState({ id: subject.id, content: null, error: true }),
    );
    return () => {
      live = false;
    };
  }, [subject, wanted, attempt]);

  const retry = useCallback(() => {
    setState({ id: subject.id, content: null, error: false });
    setAttempt((a) => a + 1);
  }, [subject.id]);

  const mine = state.id === subject.id;
  return { content: mine ? state.content : null, error: mine && state.error, retry };
}
