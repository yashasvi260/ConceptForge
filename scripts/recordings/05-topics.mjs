// Module 05: gemma4 names each default cluster from its comments and c-TF-IDF keywords (temperature 0).
import { readFileSync } from "node:fs";

const dir = "src/subjects/07-clustering-topics/data";
const docs = JSON.parse(readFileSync(`${dir}/docs.json`, "utf8")).docs;
const { groups } = JSON.parse(readFileSync(`${dir}/default-clusters.json`, "utf8"));
const { template } = JSON.parse(readFileSync(`${dir}/topicPrompt.json`, "utf8"));
const text = new Map(docs.map((d) => [d.id, d.text]));

export default {
  out: `${dir}/recordings/topics.json`,
  model: "gemma4:12b",
  options: { temperature: 0 },
  jobs: groups.map((g) => ({
    key: g.key,
    prompt: template.replace("{keywords}", g.keywords.join(", ")).replace("{comments}", g.ids.map((id) => `- ${text.get(id)}`).join("\n")),
    temperature: 0,
  })),
};
