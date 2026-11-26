/// <reference lib="webworker" />
import { loadPyodide, type PyodideInterface } from "pyodide";
import type { WorkerReply } from "./client";
import { LOAD_ERROR_MESSAGE, PYODIDE_CDN, type RunRequest } from "./program";
import { runInPyodide } from "./runCore";

declare const self: DedicatedWorkerGlobalScope;

let pyPromise: Promise<PyodideInterface> | null = null;
const post = (m: WorkerReply) => self.postMessage(m);

self.onmessage = async (e: MessageEvent<{ id: number; req: RunRequest }>) => {
  const { id, req } = e.data;
  try {
    if (!pyPromise) {
      post({ id, kind: "status", status: "loading" });
      pyPromise = loadPyodide({ indexURL: PYODIDE_CDN });
    }
    const py = await pyPromise;
    if (req.packages.length > 0) {
      post({ id, kind: "status", status: "loading" });
      await py.loadPackage(req.packages, { messageCallback: () => {} });
    }
    post({ id, kind: "status", status: "running" });
    post({ id, kind: "result", result: await runInPyodide(py, req) });
  } catch {
    pyPromise = null;
    post({ id, kind: "result", result: { status: "load-error", stdout: "", checks: [], error: LOAD_ERROR_MESSAGE } });
  }
};
