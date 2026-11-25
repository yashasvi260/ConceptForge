import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { createOllamaClient, type OllamaClient } from "./ollama";

export const OLLAMA_KEY = "conceptforge:ollama:v1";
export const DEFAULT_OLLAMA = "http://localhost:11434";

export type OllamaStatus = "off" | "connecting" | "connected" | "error";

export interface OllamaState {
  status: OllamaStatus;
  endpoint: string;
  setEndpoint: (s: string) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  client: OllamaClient | null;
  error: string | null;
}

const Ctx = createContext<OllamaState | null>(null);

function loadEndpoint(): string {
  try {
    return window.localStorage.getItem(OLLAMA_KEY) || DEFAULT_OLLAMA;
  } catch {
    return DEFAULT_OLLAMA;
  }
}

/** Opt-in connection to the learner's own Ollama. Nothing is requested until connect() is called. */
export function OllamaProvider({ children }: { children: ReactNode }) {
  const [endpoint, setEndpointState] = useState(loadEndpoint);
  const [status, setStatus] = useState<OllamaStatus>("off");
  const [client, setClient] = useState<OllamaClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setEndpoint = useCallback((s: string) => {
    setEndpointState(s);
    setStatus("off");
    setClient(null);
    try {
      window.localStorage.setItem(OLLAMA_KEY, s);
    } catch {
      // storage blocked: the address still applies for this visit
    }
  }, []);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    const c = createOllamaClient(endpoint);
    try {
      await c.version();
      setClient(c);
      setStatus("connected");
    } catch (e) {
      setClient(null);
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [endpoint]);

  const disconnect = useCallback(() => {
    setClient(null);
    setStatus("off");
  }, []);

  const value = useMemo(
    () => ({ status, endpoint, setEndpoint, connect, disconnect, client, error }),
    [status, endpoint, setEndpoint, connect, disconnect, client, error],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOllama(): OllamaState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOllama must be used inside <OllamaProvider>");
  return v;
}
