import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { loadEncoder } from "./realTokenizers";
import { useRealTokenizer } from "./useRealTokenizer";

describe("useRealTokenizer", () => {
  it("goes from loading to ready with tokens", async () => {
    const { result } = renderHook(() => useRealTokenizer("o200k_base", "hello world"));
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.tokens.map((t) => t.text)).toEqual(["hello", " world"]);
  });

  it("reports an error and recovers on retry", async () => {
    let fail = true;
    const loader = vi.fn((name: Parameters<typeof loadEncoder>[0]) =>
      fail ? Promise.reject(new Error("offline")) : loadEncoder(name),
    );
    const { result } = renderHook(() => useRealTokenizer("cl100k_base", "hi", loader));
    await waitFor(() => expect(result.current.status).toBe("error"));
    fail = false;
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.tokens).toHaveLength(1);
  });
});
