/** Shared constants and message types for the in-page Python runner. */
export const PYODIDE_VERSION = "314.0.7";
export const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
/** Per-run limit once Python is loaded. */
export const TIMEOUT_MS = 10_000;
export const MAX_OUTPUT = 20_000;

export const TIMEOUT_MESSAGE = "Stopped after 10 s: your code may loop forever.";
export const LOAD_ERROR_MESSAGE = "Couldn't load Python. Check your connection.";

export interface RunRequest {
  learnerCode: string;
  /** Earlier parts' reference solutions, run first in the same namespace. */
  prelude: string;
  /** Python defining `check_*(ns)` functions. */
  checks: string;
  /** Injected into Python as `DATA` (JSON-serialisable). */
  data: unknown;
  packages: "numpy"[];
}

export interface CheckResult {
  name: string;
  ok: boolean;
  message: string;
}

export interface RunResult {
  status: "pass" | "fail" | "error" | "timeout" | "load-error";
  stdout: string;
  checks: CheckResult[];
  error: string | null;
}
