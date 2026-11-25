import { PlugZap } from "lucide-react";
import { useOllama } from "./OllamaContext";

/** "Connect my Ollama" control. Contacts the endpoint only when the button is clicked. */
export function ConnectOllama() {
  const o = useOllama();
  if (o.status === "connected") {
    return (
      <p className="flex items-center gap-2 text-xs text-emerald-300">
        <PlugZap size={13} /> Connected to {o.endpoint}
        <button type="button" onClick={o.disconnect} className="text-slate-400 underline hover:text-slate-200">
          disconnect
        </button>
      </p>
    );
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "this site";
  return (
    <div className="space-y-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void o.connect()}
          disabled={o.status === "connecting"}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
        >
          <PlugZap size={13} /> {o.status === "connecting" ? "Connecting…" : "Connect my Ollama"}
        </button>
        <input
          aria-label="Ollama address"
          value={o.endpoint}
          onChange={(e) => o.setEndpoint(e.target.value)}
          className="w-52 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-[11px] text-slate-300"
        />
        <span className="text-slate-500">optional: run your own prompts on your PC</span>
      </div>
      {o.status === "error" && (
        <p role="alert" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-amber-200">
          Couldn't reach Ollama at {o.endpoint} ({o.error}). Make sure Ollama is running, and allow this site by setting{" "}
          <code className="font-mono">OLLAMA_ORIGINS={origin}</code> before starting it. If your browser asks to access
          devices on your local network, allow it. The recorded answers below still work.
        </p>
      )}
    </div>
  );
}
