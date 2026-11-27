import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const kvCache: DeepLesson = {
  why: [
    "Step 4's loop runs the whole model once per new token. Read literally, that means feeding the entire sequence back in every time: to write token 500, process tokens 1 to 499 again, even though nothing about them has changed. The work for each new token grows with everything before it, so generating a long reply would get slower and slower.",
    "Look closer at what attention needs from earlier tokens: only their **keys** and **values**. Thanks to the causal mask, a token's key and value depend only on the tokens before it, so once computed they never change. Store them, and each new step only has to process the one new token. That store is the **KV cache**, and every serious inference engine uses one.",
    "It's not a small optimisation. On our CPU, with 512 tokens of context, one GPT-2 step took 25.7 ms with the cache and 479 ms without, and the 20 tokens it chose were identical. In this step you'll see the cache GPT-2 really built, implement cached attention and check it against full attention, count the work saved, and work out what the cache costs in memory for real models, which is where its trouble starts.",
  ],
  worked: [
    {
      kind: "text",
      text: "Here's the real cache GPT-2 small held at the end of step 4's 20-step loop (5 prompt tokens plus 19 fed back; the 20th token was chosen but never fed). Each layer keeps a tensor of keys and one of values, shaped (batch, heads, tokens, head width):",
    },
    {
      kind: "table",
      caption: "GPT-2's real cache after a 20-step loop",
      columns: ["what", "shape", "numbers"],
      rows: [
        ["keys, one layer", "(1, 12, 24, 64)", 18432],
        ["values, one layer", "(1, 12, 24, 64)", 18432],
        ["all 12 layers, keys and values", "", 442368],
        ["bytes in 32-bit floats", "", 1769472],
      ],
      source: "worked/kv-cache.py",
    },
    {
      kind: "text",
      text: "We ran the same greedy loop twice, once reusing the cache and once feeding the whole sequence each time, and timed decode steps after a 512-token prompt on a 4-thread CPU:",
    },
    {
      kind: "table",
      caption: "The same loop with and without the cache (GPT-2 small, CPU)",
      columns: ["measure", "with the cache", "without"],
      rows: [
        ["tokens fed to the model over 20 steps", 24, 290],
        ["the same 20 tokens chosen", "yes", "yes"],
        ["one decode step at 512 tokens of context (ms)", 25.66, 479.13],
        ["64 new tokens after a 512-token prompt (s)", 1.67, 30.72],
      ],
      source: "worked/kv-cache.py",
    },
    {
      kind: "text",
      text: "And the price, from published configurations: bytes of cache per token in 16-bit numbers, and the total for one sequence at the model's full context:",
    },
    {
      kind: "table",
      caption: "KV cache per token in 16-bit, published configurations",
      columns: ["model", "layers", "KV heads", "head width", "bytes per token", "context", "GB at full context"],
      rows: [
        ["GPT-2 small", 12, 12, 64, 36864, 1024, 0.04],
        ["Llama 3 8B", 32, 8, 128, 131072, 8192, 1.07],
        ["GPT-3 175B", 96, 96, 128, 4718592, 2048, 9.66],
      ],
      source: "worked/kv-cache.py",
    },
  ],
  concept: [
    {
      heading: "What the naive loop recomputes",
      paragraphs: [
        "Without a cache, step t feeds all P + t tokens (prompt plus everything generated) through every layer. Each layer projects every token into a query, a key and a value, and every token compares its query with all the keys before it. Then the model throws all of that away except the last position's logits, and next step does it all again with one more token.",
        "Count it for GPT-2's real loop: a 5-token prompt and 20 steps fed 5 + 6 + … + 24 = 290 token positions through the model. With the cache, the first step reads the 5 prompt tokens and each of the 19 later steps feeds just one: 24 in total. The attention comparisons shrink even more. Without the cache each step redoes a whole triangle of query-key products, (P + t)(P + t + 1) / 2 of them; with it, each step adds only the newest token's row, P + t products. For long outputs the saving keeps growing.",
      ],
      lab: { view: "kvcache", label: "Cache on or off", task: "Toggle the cache and push the prompt and output lengths up. How does the gap in attention products change as the output gets longer?" },
    },
    {
      heading: "What the cache stores",
      paragraphs: [
        "The cache holds, for every layer, the key and value vectors of every token processed so far, for every key-value head. In Hugging Face it's the past_key_values returned by each forward pass; you hand it back on the next call along with the single new token. GPT-2's real cache after the loop had keys shaped (1, 12, 24, 64) in each of its 12 layers: batch 1, 12 heads, 24 tokens, 64 numbers per head. Values have the same shape.",
        "Why keys and values, but not queries? A token's query is only used once, when that token is the newest one and asks what to attend to. Its key and value are used by every later token. And why not cache the attention output or the whole hidden state? Because the newest token's output depends on its own query, which didn't exist before; only the inputs to attention from the past are reusable.",
        "So each new step is: project the new token into q, k and v; append k and v to every layer's cache; compute attention of q over all cached keys; carry on through the feed-forward network as usual. You'll write exactly that in Build it, and check it gives the same output as full attention, to the last bit of rounding.",
      ],
      formula: {
        expr: "cache bytes = 2 · L · H_kv · d_head · T · b",
        symbols: [
          { sym: "2", meaning: "a key and a value" },
          { sym: "L, H_kv, d_head", meaning: "layers, key-value heads and head width (12, 12, 64 for GPT-2 small)" },
          { sym: "T", meaning: "tokens in the cache so far" },
          { sym: "b", meaning: "bytes per number: 4 in 32-bit, 2 in 16-bit" },
        ],
        example: "GPT-2's real cache: 2 · 12 · 12 · 64 · 24 · 4 = 1,769,472 bytes.",
      },
      mistake: "Thinking the cache stores the attention weights or the queries. It stores only past keys and values: queries are used once by their own token, and attention weights are recomputed every step because the newest query is new.",
      lab: { view: "kv-shapes", label: "Inside the cache", task: "Drag the number of tokens and watch GPT-2's per-layer key and value tensors grow. How many bytes does one more token add?" },
    },
    {
      heading: "Same tokens, a fraction of the work",
      paragraphs: [
        "A cache is only useful if it's exact, and it is: caching changes how the work is arranged, not what's computed. In our recording, the loop with the cache and the loop without chose the same 20 tokens, and their logits never differed by more than 0.00067, the size of 32-bit rounding when additions happen in a different order.",
        "The speed difference is large and grows with context. With 512 tokens of context, a cached decode step took 25.7 ms and an uncached one 479 ms, 19 times longer. Generating 64 tokens took 1.7 s against 30.7 s. On a GPU the gap is just as real; it's why no production server runs without a cache, and why Hugging Face's generate() uses one by default.",
        "The cache also changes what limits speed. A cached step does very little arithmetic per byte it reads: it streams the model's weights and the whole cache from memory to process one token. So decode speed is set mostly by memory bandwidth, and every byte of cache you can avoid storing is time saved, which is where the memory bill comes in.",
      ],
      lab: { view: "kv-equal", label: "Same answer, less work", task: "Compare GPT-2's real loop with and without the cache: tokens fed, tokens chosen and time per step. What's the largest difference in any logit?" },
    },
    {
      heading: "The memory bill",
      paragraphs: [
        "The cache trades compute for memory, and the memory grows with every token of every conversation being served. Llama 3 8B needs 128 KB per token in 16-bit, so one 8,192-token conversation holds 1.07 GB of cache next to 16 GB of weights. GPT-3, with ordinary multi-head attention and 96 layers, would need 4.7 MB per token, 9.7 GB for a single full 2,048-token context.",
        "That's why the cache shapes model design and serving. Grouped-query attention (Module 03) shrinks it by sharing key-value heads; Llama 3 8B's 8 KV heads instead of 32 make it 4 times smaller. Servers quantise the cache to 8 bits, and store it in fixed-size blocks so memory isn't wasted on conversations of unknown length; that's vLLM's PagedAttention (Kwon et al. 2023), and Module 16 covers it.",
        "It also explains limits you meet as a user: maximum context lengths, higher prices for long contexts, and why many APIs offer cheaper \"cached\" input tokens. When a long prompt prefix (a system prompt or a document) is reused, the provider can keep its keys and values and skip the prefill.",
      ],
      lab: { view: "kv-memory", label: "The memory bill", task: "Pick a model and slide the context length. At what length does Llama 3 8B's cache for one conversation outgrow 4 GB?" },
    },
  ],
  guided:
    "Before opening **Same answer, less work**, predict whether the cached loop chooses exactly the same tokens as the uncached one. Then use **The memory bill** to find how many full-length Llama 3 8B conversations fit in 8 GB of spare GPU memory.",
  build: {
    id: "m04-kv-cache",
    title: "Implement cached attention and count what it saves",
    packages: ["numpy"],
    data: "m04",
    parts: [
      part("kv-cache", "p1", "Write one decode step with a KV cache and check it equals full causal attention, token by token.", [
        "Project only `x_new`: `q, k, v = x_new @ Wq, x_new @ Wk, x_new @ Wv`, then append k and v.",
        "Stack the cache with `np.stack`, score `K @ q / np.sqrt(d)`, softmax, and return `w @ V`.",
      ]),
      part("kv-cache", "p2", "Compute cache sizes from published configurations and from GPT-2's real cache shape.", [
        "Per token: `2 * layers * kv_heads * (d_model // heads) * bytes_per_number`.",
        "For a shape, multiply its sizes together, then × 2 (keys and values) × layers.",
      ]),
      part("kv-cache", "p3", "Count the work with and without the cache, and match GPT-2's real loop (24 tokens fed against 290).", [
        "Without a cache, step t feeds P + t tokens and does the whole triangle `tri(P + t)` of products.",
        "With one: the prompt once (`tri(P)`), then one new row of P + t products per later step.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m04-kv-what",
      prompt: "What does the KV cache store?",
      options: [
        "The attention weights of every past step",
        "The keys and values of every token processed so far, for every layer and key-value head",
        "The generated text",
        "The queries of every token",
      ],
      correctIndex: 1,
      explanation: "Past keys and values never change (causal mask), so they're stored; each query is used once, by its own token.",
    },
    {
      id: "m04-kv-same",
      prompt: "GPT-2's loop with the cache and without it chose the same 20 tokens. Why?",
      options: [
        "Luck",
        "Caching reorganises the work but computes the same attention; differences are only rounding (0.00067 in the logits)",
        "Because greedy decoding ignores the cache",
        "Because the cache was empty",
      ],
      correctIndex: 1,
      explanation: "The cached keys and values are exactly what would be recomputed; only the order of additions differs.",
    },
    {
      id: "m04-kv-memory",
      prompt: "Llama 3 8B stores 131,072 bytes of cache per token in 16-bit. Roughly how much for one 8,192-token conversation?",
      options: ["131 KB", "About 1 GB", "About 16 GB", "Nothing: the cache is only kept for one step"],
      correctIndex: 1,
      explanation: "131,072 × 8,192 = 1,073,741,824 bytes, 1 GiB, for each conversation being served.",
    },
  ],
  oneSentence:
    "Because past tokens' keys and values never change, the KV cache stores them so each generation step processes only the newest token, giving the same output many times faster at the price of memory that grows with layers, key-value heads, head width and every token of context.",
  deeper: [
    {
      label: "Pope et al. 2022, Efficiently Scaling Transformer Inference",
      url: "https://arxiv.org/abs/2211.05102",
      adds: "The KV cache's memory cost, memory bandwidth in decoding, and how large models are served.",
    },
    {
      label: "Kwon et al. 2023, Efficient Memory Management for LLM Serving with PagedAttention (vLLM)",
      url: "https://arxiv.org/abs/2309.06180",
      adds: "Storing the cache in blocks to serve many conversations at once.",
    },
    {
      label: "Hugging Face, KV cache strategies",
      url: "https://huggingface.co/docs/transformers/kv_cache",
      adds: "past_key_values, the cache classes in transformers, and quantised and offloaded caches.",
    },
  ],
};
