import { useEffect, useState } from "react";
import { loadEmbedder, type Embedder } from "./embeddings";

export interface EmbeddingsState {
  status: "loading" | "ready" | "error";
  /** Model download progress, 0–100. */
  progress: number;
  embedder: Embedder | null;
  retry: () => void;
}

export function useEmbeddings(
  loader: (onProgress?: (percent: number) => void) => Promise<Embedder> = loadEmbedder,
): EmbeddingsState {
  const [embedder, setEmbedder] = useState<Embedder | null>(null);
  const [status, setStatus] = useState<EmbeddingsState["status"]>("loading");
  const [progress, setProgress] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    loader((p) => alive && setProgress(Math.round(p))).then(
      (e) => {
        if (!alive) return;
        setEmbedder(e);
        setStatus("ready");
      },
      () => alive && setStatus("error"),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loader is fixed per caller
  }, [attempt]);

  return { status, progress, embedder, retry: () => setAttempt((n) => n + 1) };
}
