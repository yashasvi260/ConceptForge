export interface Combo {
  role: boolean;
  fewShot: boolean;
  cot: boolean;
  schema: boolean;
}
export const ALL_COMBOS: Combo[];
export function comboKey(c: Combo): string;
export function recordingKey(c: Combo, ticketId: string, sample: number): string;
export function buildPrompt(task: unknown, combo: Combo, ticketText: string): { system?: string; prompt: string; format?: object };
