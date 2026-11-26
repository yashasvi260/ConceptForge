import type { LessonStep } from "../../core/types";

/** Moved from Module 03 (curriculum v2). Facts checked in docs/research/part1-sources.md; logits are illustrative (labelled). */
export const steps: LessonStep[] = [
  {
    id: "logits",
    title: "From the last vector to logits",
    summary: "The final vector is compared with every entry in the vocabulary, giving one score per possible next token.",
    body: [
      "Module 03 followed the vectors through every block. Now the last block's vector for the last position is multiplied by an output matrix with one column per vocabulary entry. For GPT-4o that's about 200k scores, called **logits**.",
      "Softmax turns the logits into probabilities that sum to 1. Nothing is decided yet: the next step chooses one token from this distribution.",
    ],
    tryIt: "Read the top candidates for the prompt; notice how a small logit gap becomes a big probability gap.",
    keyTakeaway: "Logits = one score per vocabulary entry; softmax turns them into next-token probabilities.",
    callout: "p(token) = softmax(h · W_out)",
    view: "logits",
  },
  {
    id: "decoding",
    title: "Decoding: greedy, temperature, top-k, top-p",
    summary: "A decoding rule turns the probabilities into one choice, trading reliability for variety.",
    body: [
      "**Greedy** always takes the most likely token: predictable, but repetitive. **Temperature** divides the logits before softmax: below 1 sharpens, above 1 flattens.",
      "**Top-k** keeps only the k most likely tokens (Fan et al. 2018 used k = 10). **Top-p** (nucleus sampling, Holtzman et al. 2020) keeps the smallest set whose probabilities add up to p, cutting off the unreliable tail.",
      "These settings are the `temperature`, `top_k` and `top_p` parameters of LLM APIs and Ollama.",
    ],
    tryIt: "Set Top-K to 1 (greedy), then raise the temperature and widen Top-P, and sample a few times.",
    keyTakeaway: "Temperature reshapes the distribution; top-k/top-p cut its tail; then one token is sampled.",
    view: "sampling",
  },
  {
    id: "kv-cache",
    title: "The KV cache",
    summary: "Past tokens' keys and values never change, so generation stores them instead of recomputing them.",
    body: [
      "Generating token 500 needs the keys and values of tokens 1–499. Without a cache, every step recomputes all of them; with the **KV cache**, each token's K and V are computed once and reused.",
      "The price is memory that grows with context length, layers and KV heads, which is why GQA (Module 03, step 6) matters and why long contexts are expensive to serve (Module 16 goes further).",
    ],
    tryIt: "Toggle the cache and push the generated tokens up.",
    keyTakeaway: "KV cache = trade memory for compute: each token's K/V is computed once per generation.",
    callout: "cache bytes = 2 · L · H_kv · d_head · T · b",
    view: "kvcache",
  },
  {
    id: "recap",
    title: "From a vector to the next token",
    summary: "Logits, a decoding rule and a cache: what happens between the last block and the text you read.",
    body: [
      "Recap: the final vector is scored against every vocabulary entry (logits); softmax turns the scores into probabilities; a decoding rule (greedy, temperature, top-k, top-p) picks one token; the token is appended and the loop runs again, reusing every past token's keys and values from the KV cache.",
      "Next, Module 05 shows how the weights behind those logits got their values: training. Then Part II puts these models to work, starting with classifying text (Module 06).",
    ],
    tryIt: "Explain one generation step in your own words, from the last vector to the chosen token, then take the Challenge.",
    keyTakeaway: "Generation = score, pick, append, repeat; the KV cache makes the repeat cheap.",
    view: "recap",
  },
];
