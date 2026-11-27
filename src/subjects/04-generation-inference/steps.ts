import type { LessonStep } from "../../core/types";

/** Curriculum v2. Deep lessons use real GPT-2 small recordings (data/generation.json); short steps still use illustrative logits (labelled). */
export const steps: LessonStep[] = [
  {
    id: "logits",
    deep: true,
    title: "From the last vector to logits",
    summary: "The final vector is compared with every vocabulary entry, giving one score per possible next token; softmax turns the scores into probabilities.",
    body: [
      "Module 03 followed the vectors through every block. Now the last block's vector for the last position is multiplied by an output matrix with one row per vocabulary entry: 50,257 scores for GPT-2, called **logits**.",
      "Softmax turns the logits into probabilities. Only the differences between logits matter, and the same predictions at every position give the training loss and perplexity.",
    ],
    tryIt: "Compute a real GPT-2 logit from its final vector, then compare the shapes of four real next-token distributions.",
    keyTakeaway: "Logits = one score per vocabulary entry; softmax (after subtracting the max) turns them into next-token probabilities.",
    callout: "p(token) = softmax(h · Wᵀ)",
    view: "lm-head",
  },
  {
    id: "decoding",
    deep: true,
    title: "Greedy, temperature and beam search",
    summary: "A decoding rule turns the probabilities into one choice: greedy takes the top token, sampling draws one after temperature reshapes the distribution, beam search keeps several candidates.",
    body: [
      "**Greedy** always takes the most likely token: predictable, but it loops. **Sampling** draws a token at random; **temperature** divides the logits first, below 1 sharpening and above 1 flattening the distribution.",
      "**Beam search** keeps the k most likely partial sequences and finds a more likely whole, which suits tasks with one right answer.",
    ],
    tryIt: "Watch GPT-2's greedy output loop, then slide the temperature on a real distribution and compare seeded samples.",
    keyTakeaway: "Greedy is safe but repetitive; temperature controls how adventurous sampling is; beam search looks further ahead.",
    callout: "p_T(i) = exp(zᵢ / T) / Σⱼ exp(zⱼ / T)",
    view: "greedy-loop",
  },
  {
    id: "truncation",
    deep: true,
    title: "Cutting the tail: top-k, top-p and min-p",
    summary: "Truncation rules drop the long tail of unlikely tokens before sampling, so the variety comes from plausible choices only.",
    body: [
      "Thousands of individually unlikely tokens together hold a lot of probability. **Top-k** keeps a fixed number of tokens, **top-p** (nucleus sampling, Holtzman et al. 2020) keeps the smallest set holding a share p, and **min-p** keeps tokens within a fraction of the favourite.",
      "They run as a chain after temperature, in an order that matters: Hugging Face applies temperature, top-k, top-p, then min-p.",
    ],
    tryIt: "Measure the tail on real GPT-2 distributions, then run the whole sampling chain on its top 40 tokens.",
    keyTakeaway: "Temperature reshapes the distribution; top-k, top-p and min-p cut its tail; then one token is sampled.",
    callout: "nucleus = smallest set with Σ p(i) ≥ p",
    view: "tail-mass",
  },
  {
    id: "generation-loop",
    deep: true,
    title: "The generation loop",
    summary: "Run the model, pick a token, append it, repeat: until an end token, a token limit or a stop sequence ends the loop.",
    body: [
      "A decoder writes one token per forward pass. The prompt is read in one parallel **prefill**; each new token needs its own **decode** step, which is why output tokens cost more than input tokens.",
      "The loop stops at an end-of-sequence token, **max_new_tokens** or a **stop sequence**; repetition penalties act on what it has already written.",
    ],
    tryIt: "Step through GPT-2's real loop, then set stopping rules and compare prefill and decode time.",
    keyTakeaway: "Generation = score, pick, append, repeat; prefill is cheap per token, decode is one full pass per token.",
    callout: "latency ≈ prefill(prompt) + n_out × decode step",
    view: "loop-steps",
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
