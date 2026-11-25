#!/usr/bin/env node
// Record real model outputs from a local Ollama into a RecordingFile fixture (src/llm/recordings.ts).
//   OLLAMA_URL=http://<host>:11434 node scripts/record-generations.mjs scripts/recordings/<job>.mjs [--force]
// A job file default-exports { out, model, options, jobs: [{ key, prompt | messages, system?, format?,
// temperature?, logprobs?, tools? }] }. Keys already in `out` are skipped unless --force. Every recorded
// output is kept as returned: nothing is filtered or edited.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { NUM_CTX, buildGenerateBody, mergeRecordings, toRecordedGeneration } from "./lib/recording.mjs";

const OLLAMA = (process.env.OLLAMA_URL ?? "http://localhost:11434").replace(/\/+$/, "");
const args = process.argv.slice(2);
const force = args.includes("--force");
const jobPath = args.find((a) => !a.startsWith("--"));
if (!jobPath) {
  console.error("usage: node scripts/record-generations.mjs <job-file.mjs> [--force]");
  process.exit(1);
}
const spec = (await import(pathToFileURL(resolve(jobPath)).href)).default;
const outPath = resolve(spec.out);
const existing = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : null;
const done = new Set(force ? [] : (existing?.items ?? []).map((i) => i.key));
const todo = spec.jobs.filter((j) => !done.has(j.key));

async function post(path, body) {
  const res = await fetch(`${OLLAMA}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

const ollamaVersion = (await (await fetch(`${OLLAMA}/api/version`)).json()).version;
console.log(`Ollama ${ollamaVersion} at ${OLLAMA} · ${spec.model} · ${todo.length} to record (${done.size} already done)`);

let current = existing;
const save = (items) => {
  current = mergeRecordings(current, items, { model: spec.model, ollamaVersion, options: spec.options ?? {}, now: new Date().toISOString() });
  writeFileSync(outPath, JSON.stringify(current, null, 1) + "\n");
};

for (const [n, job] of todo.entries()) {
  const t0 = Date.now();
  let response;
  if (job.messages) {
    response = await post("/api/chat", {
      model: spec.model,
      messages: job.messages,
      ...(job.tools ? { tools: job.tools } : {}),
      stream: false,
      think: false,
      options: { num_ctx: NUM_CTX, ...(job.temperature !== undefined ? { temperature: job.temperature } : {}) },
    });
  } else {
    response = await post("/api/generate", buildGenerateBody(spec.model, job));
  }
  const item = toRecordedGeneration(job, response);
  save([item]); // write after every item so an interrupted run resumes where it stopped
  console.log(`[${n + 1}/${todo.length}] ${job.key} · ${((Date.now() - t0) / 1000).toFixed(1)} s · ${JSON.stringify(item.output.slice(0, 60))}`);
}
console.log(`wrote ${outPath}`);
