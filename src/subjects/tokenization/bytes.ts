const encoder = new TextEncoder();

/** UTF-8 bytes of a string. */
export function utf8Bytes(text: string): number[] {
  return Array.from(encoder.encode(text));
}

/** One row per character (code point) with its UTF-8 bytes. */
export function byteTable(text: string): { char: string; bytes: number[] }[] {
  return Array.from(text, (char) => ({ char, bytes: utf8Bytes(char) }));
}

export function hex(byte: number): string {
  return byte.toString(16).toUpperCase().padStart(2, "0");
}
