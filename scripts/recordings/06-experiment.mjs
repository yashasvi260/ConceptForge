// Module 06: every prompt combination × every test ticket × 4 samples, recorded from gemma4:12b.
// Sample 0: temperature 0 with token probabilities. Samples 1–3: temperature 0.8 (to measure output variance).
import { readFileSync } from "node:fs";
import { ALL_COMBOS, buildPrompt, recordingKey } from "../../src/subjects/06-prompt-engineering/buildPrompt.mjs";

const task = JSON.parse(readFileSync("src/subjects/06-prompt-engineering/data/task.json", "utf8"));
const jobs = [];
for (const combo of ALL_COMBOS)
  for (const t of task.tickets)
    for (const s of [0, 1, 2, 3]) {
      const p = buildPrompt(task, combo, t.text);
      jobs.push({ key: recordingKey(combo, t.id, s), ...p, temperature: s === 0 ? 0 : 0.8, logprobs: s === 0 });
    }

export default {
  out: "src/subjects/06-prompt-engineering/data/recordings/experiment.json",
  model: "gemma4:12b",
  options: { temperature: "0 for sample 0, 0.8 for samples 1–3" },
  jobs,
};
