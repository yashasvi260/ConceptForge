// Module 04: gemma4 classifies each test ticket with the prompt template from tickets.json (temperature 0, logprobs).
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync("src/subjects/06-text-classification/data/tickets.json", "utf8"));
export default {
  out: "src/subjects/06-text-classification/data/recordings/classify.json",
  model: "gemma4:12b",
  options: { temperature: 0 },
  jobs: data.tickets
    .filter((t) => t.split === "test")
    .map((t) => ({ key: `classify:${t.id}`, prompt: data.promptTemplate.replace("{ticket}", t.text), temperature: 0, logprobs: true })),
};
