import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import type { EmbeddingsState } from "./useEmbeddings";

/** Loading / error states for anything that needs the MiniLM embedding model. */
export function ModelStatus({ state, children }: { state: EmbeddingsState; children: ReactNode }) {
  if (state.status === "loading") {
    return (
      <div role="status" className="space-y-2 text-sm text-slate-400">
        <p className="flex items-center gap-2">
          <Loader2 size={15} className="animate-spin" />
          Loading the MiniLM embedding model (about 23 MB, only the first time)…
        </p>
        <div className="h-1.5 overflow-hidden rounded bg-slate-800" aria-hidden>
          <div className="h-full bg-sky-500 transition-all" style={{ width: `${state.progress}%` }} />
        </div>
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-100">
        <AlertTriangle size={16} />
        Couldn't load the embedding model (offline on first visit?). If Retry keeps failing, reload the page.
        <button type="button" onClick={state.retry} className="flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-1 hover:bg-rose-500/30">
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    );
  }
  return <>{children}</>;
}
