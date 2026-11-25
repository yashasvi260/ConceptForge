import type { TokenProb } from "../../llm/recordings";

export function tokenProbs(tokens: TokenProb[]): { token: string; p: number; alternatives: { token: string; p: number }[] }[] {
  return tokens.map((t) => ({
    token: t.token,
    p: Math.exp(t.logprob),
    alternatives: t.top.map((a) => ({ token: a.token, p: Math.exp(a.logprob) })).sort((a, b) => b.p - a.p),
  }));
}
