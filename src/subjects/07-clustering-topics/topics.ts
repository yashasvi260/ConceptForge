import { findRecording, type RecordedGeneration, type RecordingFile } from "../../llm/recordings";
import topicPromptFile from "./data/topicPrompt.json";
import topicsRec from "./data/recordings/topics.json";
import { clusterKey } from "./pipeline";

export const TOPICS = topicsRec as RecordingFile;

export function topicPrompt(members: { text: string }[], keywords: string[]): string {
  return topicPromptFile.template.replace("{keywords}", keywords.join(", ")).replace("{comments}", members.map((d) => `- ${d.text}`).join("\n"));
}

/** The recorded name for exactly this prompt (same members AND same keywords), or undefined. */
export function topicRecording(members: { id: string; text: string }[], keywords: string[]): RecordedGeneration | undefined {
  const rec = findRecording(TOPICS, clusterKey(members.map((d) => d.id)));
  return rec && rec.prompt === topicPrompt(members, keywords) ? rec : undefined;
}
