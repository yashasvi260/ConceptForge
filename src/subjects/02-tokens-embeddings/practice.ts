/** Cost of `tokens` at a price quoted per million tokens. */
export function estimateCost(tokens: number, pricePerMillion: number): number {
  return (tokens / 1_000_000) * pricePerMillion;
}

/**
 * Split a token sequence into windows of `size` tokens, each starting `size - overlap` after the
 * previous one. Returns [start, end) index pairs.
 */
export function chunkByTokens(ids: readonly number[], size: number, overlap: number): [number, number][] {
  if (!(size > 0)) throw new Error("chunk size must be positive");
  if (overlap < 0 || overlap >= size) throw new Error("overlap must be at least 0 and smaller than the chunk size");
  const chunks: [number, number][] = [];
  for (let start = 0; start < ids.length; start += size - overlap) {
    const end = Math.min(start + size, ids.length);
    chunks.push([start, end]);
    if (end === ids.length) break;
  }
  return chunks;
}
