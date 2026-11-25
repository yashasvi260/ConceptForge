import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Embedder } from "./embeddings";
import { useEmbeddings } from "./useEmbeddings";

const fake: Embedder = {
  embedSentences: async (t) => t.map(() => new Float32Array(384)),
  embedTokens: async () => ({ tokens: [], vectors: [] }),
};

describe("useEmbeddings", () => {
  it("goes from loading to ready", async () => {
    const { result } = renderHook(() => useEmbeddings(() => Promise.resolve(fake)));
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.embedder).toBe(fake);
  });

  it("reports progress, errors and recovers on retry", async () => {
    let fail = true;
    const loader = (onProgress?: (p: number) => void) => {
      onProgress?.(40);
      return fail ? Promise.reject(new Error("offline")) : Promise.resolve(fake);
    };
    const { result } = renderHook(() => useEmbeddings(loader));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.progress).toBe(40);
    fail = false;
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe("ready"));
  });
});
