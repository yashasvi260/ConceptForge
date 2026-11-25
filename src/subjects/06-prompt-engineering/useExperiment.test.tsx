import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useExperiment } from "./useExperiment";

describe("useExperiment", () => {
  it("reports a failed download and can retry", async () => {
    const good = { default: { model: "m", ollamaVersion: "", recordedAt: "", options: {}, items: [] } };
    const load = vi.fn().mockRejectedValueOnce(new Error("chunk failed")).mockResolvedValueOnce(good);
    const { result } = renderHook(() => useExperiment("small", load));
    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.file).toBeNull();
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.file?.model).toBe("m"));
    expect(result.current.error).toBe(false);
  });
});
