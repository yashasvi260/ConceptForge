// Single source for Module 06 prompts: imported by the site (prompts.ts) and by scripts/recordings/06-*.mjs.

/** All 16 on/off combinations of the four prompt components. */
export const ALL_COMBOS = [false, true].flatMap((role) =>
  [false, true].flatMap((fewShot) => [false, true].flatMap((cot) => [false, true].map((schema) => ({ role, fewShot, cot, schema })))),
);

export const comboKey = (c) => `r${+c.role}f${+c.fewShot}c${+c.cot}s${+c.schema}`;
export const recordingKey = (c, ticketId, sample) => `${comboKey(c)}:${ticketId}:s${sample}`;

/** { system?, prompt, format? } for one combination and one ticket. */
export function buildPrompt(task, combo, ticketText) {
  const parts = [];
  if (combo.fewShot) {
    for (const ex of task.fewShot) parts.push(`Message: ${ex.text}\nJSON: ${JSON.stringify(ex.answer)}`);
    parts.push("");
  }
  parts.push(task.instruction);
  if (combo.cot) parts.push(combo.schema ? task.cotSchema : task.cot);
  parts.push("", `Message: ${ticketText}`, combo.fewShot && !combo.cot ? "JSON:" : "Answer:");
  let format;
  if (combo.schema) {
    format = combo.cot
      ? {
          ...task.schema,
          properties: { reasoning: { type: "string" }, ...task.schema.properties },
          required: ["reasoning", ...task.schema.required],
        }
      : task.schema;
  }
  return { ...(combo.role ? { system: task.role } : {}), prompt: parts.join("\n"), ...(format ? { format } : {}) };
}
