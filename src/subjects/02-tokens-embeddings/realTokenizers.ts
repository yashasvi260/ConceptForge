/**
 * The real OpenAI tokenizers (from the open-source tiktoken project, via js-tiktoken). Only the
 * vocabularies run here, entirely in the browser: no model, no API calls, no network after load.
 */
import { Tiktoken } from "js-tiktoken/lite";

export type EncodingName = "o200k_base" | "cl100k_base";

export const ENCODINGS: Record<EncodingName, { label: string; models: string; approxVocab: string }> = {
  o200k_base: { label: "GPT-4o", models: "GPT-4o, GPT-4o mini", approxVocab: "≈200k" },
  cl100k_base: { label: "GPT-4", models: "GPT-4, GPT-4 Turbo, GPT-3.5 Turbo", approxVocab: "≈100k" },
};

export const DISPLAY_CHAR_LIMIT = 4000;

export interface RealEncoder {
  name: EncodingName;
  /** Special-token text typed by a user is encoded as ordinary text, never as a control token. */
  encode(text: string): number[];
  /** The exact bytes a token stands for. */
  tokenBytes(id: number): Uint8Array;
}

const loaders: Record<EncodingName, () => Promise<{ default: ConstructorParameters<typeof Tiktoken>[0] }>> = {
  o200k_base: () => import("js-tiktoken/ranks/o200k_base"),
  cl100k_base: () => import("js-tiktoken/ranks/cl100k_base"),
};

const cache = new Map<EncodingName, Promise<RealEncoder>>();
const utf8 = new TextEncoder();

export function loadEncoder(name: EncodingName): Promise<RealEncoder> {
  let p = cache.get(name);
  if (!p) {
    p = loaders[name]().then(({ default: ranks }) => {
      const tk = new Tiktoken(ranks);
      // js-tiktoken keeps each token's bytes in an internal map; fall back to decode() if it changes.
      const textMap = (tk as unknown as { textMap?: Map<number, Uint8Array> }).textMap;
      return {
        name,
        encode: (text: string) => tk.encode(text, [], []),
        tokenBytes: (id: number) => textMap?.get(id) ?? utf8.encode(tk.decode([id])),
      };
    });
    p.catch(() => cache.delete(name)); // allow a retry after a failed load
    cache.set(name, p);
  }
  return p;
}

export interface DisplayToken {
  id: number;
  /** Printable text; bytes that are only part of a character are shown as <0xNN>. */
  text: string;
}

const strictDecoder = new TextDecoder("utf-8", { fatal: true });
const lenientDecoder = new TextDecoder("utf-8");
const hexByte = (b: number) => `<0x${b.toString(16).toUpperCase().padStart(2, "0")}>`;

function tryDecode(bytes: Uint8Array): string | null {
  try {
    return strictDecoder.decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Printable label for a token: complete characters are shown as text; bytes that are only part
 * of a character (the rest lives in a neighbouring token) are shown as <0xNN>.
 */
export function tokenLabel(bytes: Uint8Array): string {
  const whole = tryDecode(bytes);
  if (whole !== null) return whole;
  // Longest decodable prefix, then the trailing partial bytes as hex.
  for (let cut = bytes.length - 1; cut > 0; cut--) {
    const head = tryDecode(bytes.subarray(0, cut));
    if (head !== null) return head + Array.from(bytes.subarray(cut), hexByte).join("");
  }
  return Array.from(bytes, hexByte).join("");
}

/** Decode a run of token ids back into text (partial characters at the edges become �). */
export function decodeTokens(enc: RealEncoder, ids: readonly number[]): string {
  const parts = ids.map((id) => enc.tokenBytes(id));
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return lenientDecoder.decode(out);
}

export function tokenizeForDisplay(
  enc: RealEncoder,
  text: string,
  limit = DISPLAY_CHAR_LIMIT,
): { tokens: DisplayToken[]; truncated: boolean } {
  const chars = Array.from(text);
  const truncated = chars.length > limit;
  const input = truncated ? chars.slice(0, limit).join("") : text;
  if (!input) return { tokens: [], truncated: false };
  return { tokens: enc.encode(input).map((id) => ({ id, text: tokenLabel(enc.tokenBytes(id)) })), truncated };
}
