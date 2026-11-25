/** Character-level split: one entry per Unicode code point (so an emoji stays whole). */
export function splitChars(text: string): string[] {
  return Array.from(text);
}

/** Word-level split: runs of letters, runs of digits, and each punctuation mark on its own. */
export function splitWords(text: string): string[] {
  return text.match(/\p{L}[\p{L}\p{M}']*|\p{N}+|[^\s\p{L}\p{N}]/gu) ?? [];
}
