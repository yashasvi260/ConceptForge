import type { PyodideInterface } from "pyodide";
import harnessSource from "./harness.py?raw";
import { MAX_OUTPUT, type RunRequest, type RunResult } from "./program";

const ready = new WeakSet<PyodideInterface>();

/** Runs one exercise attempt in an already-loaded Pyodide (used by the worker and by Node tests). */
export async function runInPyodide(py: PyodideInterface, req: RunRequest): Promise<RunResult> {
  if (!ready.has(py)) {
    py.runPython(harnessSource.replace("__CF_MAX_OUTPUT__", String(MAX_OUTPUT)));
    ready.add(py);
  }
  if (req.packages.length > 0) await py.loadPackage(req.packages, { messageCallback: () => {} });
  const run = py.globals.get("_cf_run") as (a: string, b: string, c: string, d: string) => string;
  const json = run(req.learnerCode, req.prelude, req.checks, JSON.stringify(req.data ?? null));
  return JSON.parse(json) as RunResult;
}
