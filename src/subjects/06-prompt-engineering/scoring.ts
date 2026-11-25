import type { Gold } from "./prompts";

/**
 * The answer's JSON: the whole output if it parses (optionally inside a ``` fence), otherwise the last balanced
 * {...} block (for answers with reasoning text before the JSON); null if there is none or it isn't valid JSON.
 */
export function extractJson(output: string): unknown {
  const whole = output.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(whole);
  } catch {
    // fall through to the brace scan
  }
  const end = output.lastIndexOf("}");
  if (end < 0) return null;
  let depth = 0;
  for (let i = end; i >= 0; i--) {
    const ch = output[i];
    if (ch === "}") depth++;
    else if (ch === "{") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(output.slice(i, end + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

const CATEGORIES = ["card", "transfer", "fraud", "account", "loan"];

function isValid(x: unknown): x is Gold {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.category === "string" &&
    CATEGORIES.includes(o.category.toLowerCase()) &&
    (o.amount === null || typeof o.amount === "number") &&
    (o.currency === null || typeof o.currency === "string") &&
    typeof o.urgent === "boolean"
  );
}

export function scoreExtraction(parsed: unknown, gold: Gold): { valid: boolean; fieldsCorrect: number; total: 4 } {
  if (!isValid(parsed)) return { valid: false, fieldsCorrect: 0, total: 4 };
  const ok = [
    parsed.category.toLowerCase() === gold.category,
    parsed.amount === null || gold.amount === null ? parsed.amount === gold.amount : Math.abs(parsed.amount - gold.amount) < 0.01,
    (parsed.currency?.toUpperCase() ?? null) === gold.currency,
    parsed.urgent === gold.urgent,
  ];
  return { valid: true, fieldsCorrect: ok.filter(Boolean).length, total: 4 };
}

/** Normalised answer: the four fields in a fixed order, or the raw text when it isn't valid. */
function normalise(output: string): string {
  const p = extractJson(output);
  if (!isValid(p)) return `invalid:${output.trim()}`;
  return JSON.stringify([p.category.toLowerCase(), p.amount, p.currency?.toUpperCase() ?? null, p.urgent]);
}

export function variance(outputs: string[]): { distinct: number; of: number } {
  return { distinct: new Set(outputs.map(normalise)).size, of: outputs.length };
}
