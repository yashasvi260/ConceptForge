/// <reference lib="webworker" />
import type { PyodideInterface, loadPyodide as LoadPyodide } from "pyodide";
import type { WorkerReply } from "./client";
import { LOAD_ERROR_MESSAGE, PYODIDE_CDN, type RunRequest } from "./program";
import { runInPyodide } from "./runCore";

declare const self: DedicatedWorkerGlobalScope;

let pyPromise: Promise<PyodideInterface> | null = null;
const post = (m: WorkerReply) => self.postMessage(m);

self.onmessage = async (e: MessageEvent<{ id: number; req: RunRequest }>) => {
  const { id, req } = e.data;
  let py: PyodideInterface;
  try {
    if (!pyPromise) {
      post({ id, kind: "status", status: "loading" });
      // Loaded from the same pinned CDN release as the runtime files (not bundled into the site).
      pyPromise = import(/* @vite-ignore */ `${PYODIDE_CDN}pyodide.mjs`).then((m: { loadPyodide: typeof LoadPyodide }) =>
        m.loadPyodide({ indexURL: PYODIDE_CDN }),
      );
    }
    py = await pyPromise;
    if (req.packages.length > 0) {
      post({ id, kind: "status", status: "loading" });
      await py.loadPackage(req.packages, { messageCallback: () => {} });
    }
  } catch {
    pyPromise = null;
    post({ id, kind: "result", result: { status: "load-error", stdout: "", checks: [], error: LOAD_ERROR_MESSAGE } });
    return;
  }
  post({ id, kind: "status", status: "running" });
  try {
    post({ id, kind: "result", result: await runInPyodide(py, req) });
  } catch (err) {
    post({ id, kind: "result", result: { status: "error", stdout: "", checks: [], error: `The exercise checks crashed: ${String(err)}` } });
  }
};
