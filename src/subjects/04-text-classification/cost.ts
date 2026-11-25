/** Estimated API cost in dollars: tokens × price per million tokens (the price is the learner's assumption). */
export function estimateCost(tokens: number, pricePerMillion: number): number {
  return (tokens / 1_000_000) * pricePerMillion;
}
