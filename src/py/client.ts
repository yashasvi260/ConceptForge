import { LOAD_ERROR_MESSAGE, TIMEOUT_MESSAGE, TIMEOUT_MS, type RunRequest, type RunResult } from "./program";

export type RunStatus = "loading" | "running";
export type RunFn = (req: RunRequest, onStatus: (s: RunStatus) => void) => Promise<RunResult>;

export type WorkerReply =
  | { id: number; kind: "status"; status: RunStatus }
  | { id: number; kind: "result"; result: RunResult };

export interface WorkerLike {
  postMessage(m: { id: number; req: RunRequest }): void;
  terminate(): void;
  onmessage: ((e: { data: WorkerReply }) => void) | null;
  /** Fires if the worker script can't be fetched or evaluated (for example offline on first Run). */
  onerror: ((e: unknown) => void) | null;
  onmessageerror: ((e: unknown) => void) | null;
}

const LOAD_LIMIT_MS = 120_000;

const failed = (status: "timeout" | "load-error", error: string): RunResult => ({ status, stdout: "", checks: [], error });

/**
 * Runs requests one at a time on a lazily spawned worker. The run limit starts once Python is
 * ready ("running"), so the first download never counts; a stuck run or load kills the worker
 * and the next request gets a fresh one.
 */
export function createRunner(spawn: () => WorkerLike, timeoutMs = TIMEOUT_MS, loadLimitMs = LOAD_LIMIT_MS): RunFn {
  let worker: WorkerLike | null = null;
  let nextId = 1;
  let queue: Promise<unknown> = Promise.resolve();

  const runOne = (req: RunRequest, onStatus: (s: RunStatus) => void) =>
    new Promise<RunResult>((resolve) => {
      const w = (worker ??= spawn());
      const id = nextId++;
      let timer = setTimeout(() => finish(failed("load-error", LOAD_ERROR_MESSAGE), true), loadLimitMs);
      const finish = (r: RunResult, kill: boolean) => {
        clearTimeout(timer);
        w.onmessage = w.onerror = w.onmessageerror = null;
        if (kill) {
          w.terminate();
          if (worker === w) worker = null;
        }
        resolve(r);
      };
      w.onmessage = ({ data }) => {
        if (data.id !== id) return;
        if (data.kind === "status") {
          onStatus(data.status);
          if (data.status === "running") {
            clearTimeout(timer);
            timer = setTimeout(() => finish(failed("timeout", TIMEOUT_MESSAGE), true), timeoutMs);
          }
        } else {
          finish(data.result, data.result.status === "load-error");
        }
      };
      w.onerror = w.onmessageerror = () => finish(failed("load-error", LOAD_ERROR_MESSAGE), true);
      w.postMessage({ id, req });
    });

  let pending = 0;
  return (req, onStatus) => {
    // Start at once when idle (so the worker spawns synchronously); otherwise wait our turn.
    const p = pending === 0 ? runOne(req, onStatus) : queue.then(() => runOne(req, onStatus));
    pending++;
    queue = p.finally(() => pending--);
    return p;
  };
}
