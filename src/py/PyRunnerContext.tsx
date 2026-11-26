import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createRunner, type RunFn, type WorkerLike } from "./client";

/** The real runner: one Pyodide worker, spawned on the first Run. */
export function createWorkerRunner(): RunFn {
  return createRunner(
    () => new Worker(new URL("./py.worker.ts", import.meta.url), { type: "module" }) as unknown as WorkerLike,
  );
}

const Ctx = createContext<RunFn | null>(null);

export function PyRunnerProvider({ run, children }: { run?: RunFn; children: ReactNode }) {
  const value = useMemo<RunFn>(() => {
    if (run) return run;
    let real: RunFn | null = null;
    return (req, onStatus) => (real ??= createWorkerRunner())(req, onStatus);
  }, [run]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePyRunner(): RunFn {
  const run = useContext(Ctx);
  if (!run) throw new Error("usePyRunner needs a PyRunnerProvider");
  return run;
}
