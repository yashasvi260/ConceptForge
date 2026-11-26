/**
 * The generation-loop lab's logic, over a tree of REAL gemma4 replies (scripts/record-generation-tree.mjs).
 * Each node is a point in a reply: gemma4's top-10 next-token log-probabilities there, and the branches that
 * recorded replies actually took. The lab only ever walks recorded branches, so every number shown is real.
 */

/** [token, log-probability] pairs, most likely first; null where no reply continued (it ended or was cut). */
export interface GenNode {
  top: [string, number][] | null;
  children: Record<string, number>;
  visits: number;
  /** How many recorded replies ended here with the model's own end-of-turn token. */
  ends: number;
}

export interface GenTree {
  prompt: string;
  nodes: GenNode[];
}

export interface Choice {
  token: string;
  /** gemma4's real probability for this token. */
  raw: number;
  /** The same list re-weighted by temperature (p^(1/T), renormalised over the top 10). */
  adjusted: number;
  /** A recorded reply took this branch, so the lab can follow it. */
  recorded: boolean;
}

export const STAGES = [
  { title: "Feed context", detail: "The prompt and every token generated so far go into the model." },
  { title: "Score every token", detail: "One full forward pass gives a probability for every token in the vocabulary." },
  { title: "Choose one token", detail: "Sample one (temperature decides how adventurous), or click a bar to pick it yourself." },
  { title: "Append to context", detail: "The chosen token is added for good; it can never be taken back." },
  { title: "Repeat or stop", detail: "Stop if the model ended its reply or the token limit is reached; otherwise loop to stage 1." },
] as const;

export type StopReason = "model-ended" | "max-tokens" | "not-recorded";

export interface LabState {
  /** Index into STAGES of the stage just completed. */
  stage: number;
  node: number;
  /** The node whose distribution the last forward pass produced (kept on screen until the next pass). */
  scored: number | null;
  generated: string[];
  chosen: string | null;
  forwardPasses: number;
  stopped: StopReason | null;
}

export interface LabOptions {
  temperature: number;
  maxTokens: number;
  rand: () => number;
}

export function initialLab(): LabState {
  return { stage: 0, node: 0, scored: null, generated: [], chosen: null, forwardPasses: 0, stopped: null };
}

export function choicesAt(tree: GenTree, nodeIndex: number, temperature: number): Choice[] {
  const node = tree.nodes[nodeIndex];
  if (!node?.top) return [];
  const raw = node.top.map(([, lp]) => Math.exp(lp));
  let adjusted: number[];
  if (temperature <= 0) {
    const best = raw.indexOf(Math.max(...raw));
    adjusted = raw.map((_, i) => (i === best ? 1 : 0));
  } else {
    const w = raw.map((p) => p ** (1 / temperature));
    const sum = w.reduce((a, b) => a + b, 0);
    adjusted = w.map((x) => x / sum);
  }
  return node.top.map(([token], i) => ({ token, raw: raw[i]!, adjusted: adjusted[i]!, recorded: token in node.children }));
}

/** Share of gemma4's probability that falls on branches the lab can follow. */
export function coverage(tree: GenTree, nodeIndex: number): number {
  return choicesAt(tree, nodeIndex, 1)
    .filter((c) => c.recorded)
    .reduce((s, c) => s + c.raw, 0);
}

function sample(choices: Choice[], temperature: number, rand: () => number): string {
  const followable = choices.filter((c) => c.recorded);
  if (temperature <= 0) return followable.reduce((a, b) => (b.raw > a.raw ? b : a)).token;
  const total = followable.reduce((s, c) => s + c.adjusted, 0);
  let r = rand() * total;
  for (const c of followable) {
    r -= c.adjusted;
    if (r < 0) return c.token;
  }
  return followable[followable.length - 1]!.token;
}

/** Advance one micro-step through the five stages. A stopped lab stays as it is. */
export function labStep(s: LabState, tree: GenTree, o: LabOptions): LabState {
  if (s.stopped) return s;
  switch (s.stage) {
    case 0:
      return { ...s, stage: 1, scored: s.node, chosen: null, forwardPasses: s.forwardPasses + 1 };
    case 1:
      return { ...s, stage: 2, chosen: sample(choicesAt(tree, s.node, o.temperature), o.temperature, o.rand) };
    case 2: {
      const next = tree.nodes[s.node]!.children[s.chosen!]!;
      return { ...s, stage: 3, node: next, generated: [...s.generated, s.chosen!] };
    }
    case 3: {
      const node = tree.nodes[s.node]!;
      const stopped: StopReason | null = !node.top
        ? node.ends > 0
          ? "model-ended"
          : "not-recorded"
        : s.generated.length >= o.maxTokens
          ? "max-tokens"
          : null;
      return { ...s, stage: 4, stopped };
    }
    default:
      return { ...s, stage: 0, chosen: null };
  }
}

/** The learner picks a token by clicking its bar: allowed while scoring or choosing, for recorded branches only. */
export function pickToken(s: LabState, tree: GenTree, token: string): LabState {
  if (s.stopped || (s.stage !== 1 && s.stage !== 2)) return s;
  if (!(token in (tree.nodes[s.node]?.children ?? {}))) return s;
  return { ...s, stage: 2, chosen: token };
}
