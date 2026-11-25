import { useEffect, useMemo, useState } from "react";
import { loadEncoder, tokenizeForDisplay, type DisplayToken, type EncodingName, type RealEncoder } from "./realTokenizers";

export interface RealTokenizerState {
  status: "loading" | "ready" | "error";
  tokens: DisplayToken[];
  truncated: boolean;
  encoder: RealEncoder | null;
  retry: () => void;
}

/** Loads a real tokenizer on demand and tokenizes `text` with it. */
export function useRealTokenizer(
  name: EncodingName,
  text: string,
  loader: (name: EncodingName) => Promise<RealEncoder> = loadEncoder,
): RealTokenizerState {
  const [encoder, setEncoder] = useState<RealEncoder | null>(null);
  const [status, setStatus] = useState<RealTokenizerState["status"]>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    loader(name).then(
      (enc) => {
        if (!alive) return;
        setEncoder(enc);
        setStatus("ready");
      },
      () => {
        if (alive) setStatus("error");
      },
    );
    return () => {
      alive = false;
    };
  }, [name, loader, attempt]);

  const result = useMemo(
    () => (encoder && encoder.name === name ? tokenizeForDisplay(encoder, text) : { tokens: [], truncated: false }),
    [encoder, name, text],
  );

  return {
    status: encoder && encoder.name === name && status !== "error" ? "ready" : status,
    tokens: result.tokens,
    truncated: result.truncated,
    encoder: encoder && encoder.name === name ? encoder : null,
    retry: () => setAttempt((n) => n + 1),
  };
}
