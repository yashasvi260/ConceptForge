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
}

/** Shows a recorded model output with its provenance; optionally re-runs it live on the learner's Ollama. */
export function GenerationPanel({ file, recording, live, title = "Model output" }: GenerationPanelProps) {
  const o = useOllama();
  const [liveOut, setLiveOut] = useState<{ text: string; model: string; ms: number } | null>(null);
  const [liveErr, setLiveErr] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const runLive = async () => {
    if (!o.client || !live) return;
    setRunning(true);
    setLiveErr(null);
    try {
      const r = await o.client.generate(live.request);
      setLiveOut({ text: r.output, model: live.request.model, ms: r.durationMs });
    } catch (e) {
      setLiveErr(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <section aria-label={title} className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        <Bot size={13} /> {title}
      </p>
      {recording ? (
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
          {liveErr && <p role="alert" className="text-xs text-rose-300">{liveErr}</p>}
          {liveOut && (
            <>
              <pre className="whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-2.5 font-mono text-xs text-slate-200">{liveOut.text}</pre>
              <p className="font-mono text-[10px] text-slate-500">
                live from {liveOut.model} · {(liveOut.ms / 1000).toFixed(1)} s
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
