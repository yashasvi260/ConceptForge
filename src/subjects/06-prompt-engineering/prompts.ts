import { ALL_COMBOS, buildPrompt as build, comboKey, recordingKey, type Combo } from "./buildPrompt.mjs";
import task from "./data/task.json";

export { ALL_COMBOS, comboKey, recordingKey, type Combo };
export const TASK = task;
export type Gold = { category: string; amount: number | null; currency: string | null; urgent: boolean };
export const TICKETS = task.tickets as { id: string; text: string; gold: Gold }[];

export function buildPrompt(combo: Combo, ticketText: string): { system?: string; prompt: string; format?: object } {
  return build(task, combo, ticketText);
}
