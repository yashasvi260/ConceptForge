import { Bot, Play } from "lucide-react";
import { useState } from "react";
import { ConnectOllama } from "./ConnectOllama";
import type { GenerateRequest } from "./ollama";
import { useOllama } from "./OllamaContext";
import { recordingLabel, type RecordedGeneration, type RecordingFile } from "./recordings";

interface GenerationPanelProps {
  file: RecordingFile;
  /** The recording for the current setting, or undefined when none was recorded. */
  recording: RecordedGeneration | undefined;
  /** What to send when the learner runs this live on their own Ollama. */
  live?: { request: GenerateRequest };
  title?: string;
  /** The recordings themselves are still downloading. */
  loading?: boolean;
}

/** Shows a recorded model output with its provenance; optionally re-runs it live on the learner's Ollama. */
export function GenerationPanel({ file, recording, live, title = "Model output", loading = false }: GenerationPanelProps) {
  const o = useOllama();
  // Live results remember the request they answer; they are shown only while that request is current,
  // so changing the ticket or setting never leaves an answer to a different prompt on screen.
  const requestKey = live ? JSON.stringify(live.request) : "";
  const [liveOut, setLiveOut] = useState<{ key: string; text: string; model: string; ms: number } | null>(null);
  const [liveErr, setLiveErr] = useState<{ key: string; message: string } | null>(null);
  const [runningKey, setRunningKey] = useState<string | null>(null);
  const shownOut = liveOut?.key === requestKey ? liveOut : null;
  const shownErr = liveErr?.key === requestKey ? liveErr.message : null;
  const running = runningKey === requestKey;

  const runLive = async () => {
    if (!o.client || !live) return;
    const key = requestKey;
    setRunningKey(key);
    setLiveErr(null);
    try {
      const r = await o.client.generate(live.request);
      setLiveOut({ key, text: r.output, model: live.request.model, ms: r.durationMs });
    } catch (e) {
      setLiveErr({ key, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setRunningKey((k) => (k === key ? null : k));
    }
  };

  return (
    <section aria-label={title} className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        <Bot size={13} /> {title}
      </p>
      {loading ? (
        <p role="status" className="rounded-lg border border-dashed border-slate-700 p-2.5 text-xs text-slate-400">
          Loading the recorded runs…
        </p>
      ) : recording ? (
        <>
          <pre className="whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-2.5 font-mono text-xs text-slate-200">{recording.output}</pre>
          <p className="font-mono text-[10px] text-slate-500">
            {recordingLabel(file)} · {(recording.durationMs / 1000).toFixed(1)} s
          </p>
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-700 p-2.5 text-xs text-slate-400">
          No recording for this setting. The examples were recorded once from a real model; connect your own Ollama to run
          this one live.
        </p>
      )}
      {live && (
        <div className="space-y-2 border-t border-slate-800 pt-2">
          <ConnectOllama />
          {o.status === "connected" && (
            <button
              type="button"
              onClick={() => void runLive()}
              disabled={running}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-2.5 py-1 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
            >
              <Play size={12} /> {running ? "Running…" : "Run live"}
            </button>
          )}
          {shownErr && <p role="alert" className="text-xs text-rose-300">{shownErr}</p>}
          {shownOut && (
            <>
              <pre className="whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-2.5 font-mono text-xs text-slate-200">{shownOut.text}</pre>
              <p className="font-mono text-[10px] text-slate-500">
                live from {shownOut.model} · {(shownOut.ms / 1000).toFixed(1)} s
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
