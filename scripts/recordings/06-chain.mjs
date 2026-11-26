// Module 06 prompt chain, recorded from gemma4:12b at temperature 0. Run twice:
// the first run records step 1 (extract with role + few-shot + schema); the second records step 2 (reply),
// whose prompt contains step 1's recorded JSON.
import { existsSync, readFileSync } from "node:fs";
import { buildPrompt } from "../../src/subjects/08-prompt-engineering/buildPrompt.mjs";

const task = JSON.parse(readFileSync("src/subjects/08-prompt-engineering/data/task.json", "utf8"));
const out = "src/subjects/08-prompt-engineering/data/recordings/chain.json";
const done = existsSync(out) ? new Map(JSON.parse(readFileSync(out, "utf8")).items.map((i) => [i.key, i])) : new Map();
const step1Combo = { role: true, fewShot: true, cot: false, schema: true };

const jobs = [];
for (const t of task.tickets) {
  jobs.push({ key: `chain:${t.id}:1`, ...buildPrompt(task, step1Combo, t.text), temperature: 0 });
  const s1 = done.get(`chain:${t.id}:1`);
  if (s1) jobs.push({ key: `chain:${t.id}:2`, prompt: task.chain.step2.replace("{ticket}", t.text).replace("{json}", s1.output.trim()), temperature: 0 });
}

export default { out, model: "gemma4:12b", options: { temperature: 0 }, jobs };
