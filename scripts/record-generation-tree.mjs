#!/usr/bin/env node
// Records REAL next-token probabilities from gemma4 for Module 01's generation-loop lab.
// For each prompt, many complete replies are generated (sampled, so they take different branches); every
// generated token comes with gemma4's own top-10 distribution at that point. The replies are merged into a
// tree: each node is a point in a reply, holding the real distribution and the recorded branches.
// Continuous generation only: prefilling a partial reply changes gemma4's token boundaries, so it is not used.
//   OLLAMA_URL=http://<host>:11434 node scripts/record-generation-tree.mjs
import { writeFileSync } from "node:fs";

const URL_BASE = process.env.OLLAMA_URL;
if (!URL_BASE) throw new Error("set OLLAMA_URL, e.g. http://172.30.208.1:11434");
const MODEL = "gemma4:12b";
const SYSTEM = "Continue the user's text with the next few words. Reply with the continuation only.";
export const PROMPTS = [
  "Once upon a time, there was a",
  "My favourite thing about weekends is",
  "The bank approved the",
  "The capital of France is",
];
const MAX_TOKENS = 12;
/** Sampling settings used only to explore different branches; the recorded probabilities are gemma4's raw ones. */
const RUNS = [{ temperature: 1.0, n: 40 }, { temperature: 1.5, n: 20 }];
const OUT = "src/subjects/01-intro-llms/data/generation-tree.json";

const r4 = (x) => Math.round(x * 1e4) / 1e4;
async function post(path, body) {
  const res = await fetch(`${URL_BASE}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

const version = (await (await fetch(`${URL_BASE}/api/version`)).json()).version;
const trees = [];
for (const prompt of PROMPTS) {
  const nodes = [{ top: null, children: {}, visits: 0, ends: 0 }];
  let seed = 1;
  for (const { temperature, n } of RUNS) {
    for (let k = 0; k < n; k++) {
      const r = await post("/api/chat", {
        model: MODEL,
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }],
        stream: false, think: false, logprobs: true, top_logprobs: 10,
        options: { num_ctx: 32768, temperature, seed: seed++, num_predict: MAX_TOKENS },
      });
      let at = 0;
      nodes[0].visits++;
      for (const step of r.logprobs ?? []) {
        const node = nodes[at];
        node.top ??= step.top_logprobs.map((t) => [t.token, r4(t.logprob)]);
        if (node.children[step.token] === undefined) {
          node.children[step.token] = nodes.length;
          nodes.push({ top: null, children: {}, visits: 0, ends: 0 });
        }
        at = node.children[step.token];
        nodes[at].visits++;
      }
      if (r.done_reason === "stop") nodes[at].ends++;
    }
  }
  trees.push({ prompt, nodes });
  console.log(`${prompt}: ${nodes.length} nodes`);
}
writeFileSync(OUT, JSON.stringify({
  model: MODEL, ollamaVersion: version, recordedAt: new Date().toISOString().slice(0, 10),
  system: SYSTEM, maxTokens: MAX_TOKENS, runs: RUNS, topK: 10, trees,
}));
console.log(`wrote ${OUT}`);
