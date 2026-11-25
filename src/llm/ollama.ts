/** Minimal Ollama HTTP client, used only after the learner clicks "Connect my Ollama". */
import type { RecordedGeneration, TokenProb } from "./recordings";

export interface GenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  /** Ollama structured output: "json" or a JSON schema. */
  format?: unknown;
  temperature?: number;
  logprobs?: boolean;
  /** Key copied onto the result, so live outputs line up with recorded ones. */
  key?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: { function: { name: string; arguments: Record<string, unknown> } }[];
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  tools?: unknown[];
  temperature?: number;
}

export interface ChatResult {
  content: string;
  toolCalls: { name: string; arguments: Record<string, unknown> }[];
}

export interface OllamaClient {
  version(): Promise<string>;
  generate(req: GenerateRequest): Promise<RecordedGeneration>;
  chat(req: ChatRequest): Promise<ChatResult>;
}

/** Every call keeps the whole context on the GPU and skips the hidden "thinking" channel. */
export const NUM_CTX = 32768;

interface OllamaLogprob {
  token: string;
  logprob: number;
  top_logprobs?: { token: string; logprob: number }[];
}

export function toTokenProbs(logprobs: OllamaLogprob[] | undefined): TokenProb[] | undefined {
  if (!logprobs) return undefined;
  return logprobs.map((l) => ({
    token: l.token,
    logprob: l.logprob,
    top: (l.top_logprobs ?? []).map((t) => ({ token: t.token, logprob: t.logprob })),
  }));
}

export function createOllamaClient(baseUrl: string, fetchFn: typeof fetch = (...a) => fetch(...a)): OllamaClient {
  const base = baseUrl.replace(/\/+$/, "");
  async function call<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetchFn(`${base}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Ollama ${path} failed: HTTP ${res.status}`);
    return (await res.json()) as T;
  }

  return {
    async version() {
      return (await call<{ version: string }>("/api/version")).version;
    },
    async generate(req) {
      const options: Record<string, number> = { num_ctx: NUM_CTX };
      if (req.temperature !== undefined) options.temperature = req.temperature;
      const r = await call<{ response: string; total_duration?: number; eval_count?: number; prompt_eval_count?: number; logprobs?: OllamaLogprob[] }>(
        "/api/generate",
        {
          model: req.model,
          prompt: req.prompt,
          ...(req.system ? { system: req.system } : {}),
          ...(req.format !== undefined ? { format: req.format } : {}),
          stream: false,
          think: false,
          ...(req.logprobs ? { logprobs: true, top_logprobs: 5 } : {}),
          options,
        },
      );
      const tokens = toTokenProbs(r.logprobs);
      return {
        key: req.key ?? "live",
        ...(req.system ? { system: req.system } : {}),
        prompt: req.prompt,
        output: r.response,
        ...(tokens ? { tokens } : {}),
        durationMs: Math.round((r.total_duration ?? 0) / 1e6),
        evalCount: r.eval_count ?? 0,
        ...(r.prompt_eval_count !== undefined ? { promptEvalCount: r.prompt_eval_count } : {}),
      };
    },
    async chat(req) {
      const r = await call<{ message: ChatMessage }>("/api/chat", {
        model: req.model,
        messages: req.messages,
        ...(req.tools ? { tools: req.tools } : {}),
        stream: false,
        think: false,
        options: { num_ctx: NUM_CTX, ...(req.temperature !== undefined ? { temperature: req.temperature } : {}) },
      });
      return {
        content: r.message.content ?? "",
        toolCalls: (r.message.tool_calls ?? []).map((t) => ({ name: t.function.name, arguments: t.function.arguments })),
      };
    },
  };
}
