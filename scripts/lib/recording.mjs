// Shared helpers for scripts/record-generations.mjs. Output shape = RecordingFile in src/llm/recordings.ts.
export const NUM_CTX = 32768;

/** Body for Ollama /api/generate: thinking off, whole context on the GPU, optional logprobs. */
export function buildGenerateBody(model, job) {
  const options = { num_ctx: NUM_CTX };
  if (job.temperature !== undefined) options.temperature = job.temperature;
  return {
    model,
    prompt: job.prompt,
    ...(job.system ? { system: job.system } : {}),
    ...(job.format !== undefined ? { format: job.format } : {}),
    stream: false,
    think: false,
    ...(job.logprobs ? { logprobs: true, top_logprobs: 5 } : {}),
    options,
  };
}

export function toRecordedGeneration(job, response) {
  const tokens = response.logprobs?.map((l) => ({
    token: l.token,
    logprob: l.logprob,
    top: (l.top_logprobs ?? []).map((t) => ({ token: t.token, logprob: t.logprob })),
  }));
  const toolCalls = response.message?.tool_calls?.map((t) => ({ name: t.function.name, arguments: t.function.arguments }));
  return {
    key: job.key,
    ...(job.system ? { system: job.system } : {}),
    prompt: job.prompt ?? (job.messages ? JSON.stringify(job.messages) : ""),
    output: response.response ?? response.message?.content ?? "",
    ...(tokens ? { tokens } : {}),
    ...(toolCalls?.length ? { toolCalls } : {}),
    durationMs: Math.round((response.total_duration ?? 0) / 1e6),
    evalCount: response.eval_count ?? 0,
    ...(response.prompt_eval_count !== undefined ? { promptEvalCount: response.prompt_eval_count } : {}),
  };
}

/** Append new items (replacing same keys) and stamp the file. */
export function mergeRecordings(existing, newItems, { model, ollamaVersion, options, now }) {
  const byKey = new Map((existing?.items ?? []).map((i) => [i.key, i]));
  for (const item of newItems) byKey.set(item.key, item);
  return { model, ollamaVersion, recordedAt: now, options, items: [...byKey.values()] };
}
