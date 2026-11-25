import { describe, expect, it, vi } from "vitest";
import { createOllamaClient } from "./ollama";

function fakeFetch(body: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}
const sentBody = (f: ReturnType<typeof vi.fn>) => JSON.parse((f.mock.calls[0]![1] as RequestInit).body as string);

const GEN = {
  model: "gemma4:12b",
  response: "card",
  done: true,
  total_duration: 250_000_000,
  eval_count: 2,
  prompt_eval_count: 30,
  logprobs: [{ token: "card", logprob: -0.05, bytes: [99], top_logprobs: [{ token: "card", logprob: -0.05 }, { token: "fraud", logprob: -3.2 }] }],
};

describe("ollama client", () => {
  it("generate sends think false and num_ctx 32768", async () => {
    const f = fakeFetch(GEN);
    const c = createOllamaClient("http://localhost:11434/", f);
    await c.generate({ model: "gemma4:12b", prompt: "hi", temperature: 0, logprobs: true });
    expect(f.mock.calls[0]![0]).toBe("http://localhost:11434/api/generate");
    const body = sentBody(f);
    expect(body).toMatchObject({ model: "gemma4:12b", prompt: "hi", stream: false, think: false, logprobs: true, top_logprobs: 5 });
    expect(body.options).toEqual({ num_ctx: 32768, temperature: 0 });
  });

  it("maps logprobs to TokenProb", async () => {
    const c = createOllamaClient("http://x", fakeFetch(GEN));
    const r = await c.generate({ model: "gemma4:12b", prompt: "hi", key: "k1" });
    expect(r).toMatchObject({ key: "k1", prompt: "hi", output: "card", durationMs: 250, evalCount: 2, promptEvalCount: 30 });
    expect(r.tokens).toEqual([{ token: "card", logprob: -0.05, top: [{ token: "card", logprob: -0.05 }, { token: "fraud", logprob: -3.2 }] }]);
  });

  it("chat returns tool calls", async () => {
    const f = fakeFetch({ message: { role: "assistant", content: "", tool_calls: [{ function: { name: "calc", arguments: { expr: "17*23" } } }] }, done: true });
    const c = createOllamaClient("http://x", f);
    const r = await c.chat({ model: "gemma4:12b", messages: [{ role: "user", content: "17*23?" }], tools: [] });
    expect(r.toolCalls).toEqual([{ name: "calc", arguments: { expr: "17*23" } }]);
    expect(sentBody(f)).toMatchObject({ think: false, stream: false });
  });

  it("non-200 throws with status", async () => {
    const c = createOllamaClient("http://x", fakeFetch({ error: "model not found" }, 404));
    await expect(c.generate({ model: "m", prompt: "p" })).rejects.toThrow(/404/);
  });

  it("version reads /api/version", async () => {
    const f = fakeFetch({ version: "0.40.18" });
    expect(await createOllamaClient("http://x", f).version()).toBe("0.40.18");
    expect(f.mock.calls[0]![0]).toBe("http://x/api/version");
  });
});
