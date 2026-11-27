import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const gqa: DeepLesson = {
  why: [
    "When a model generates text, it doesn't recompute the keys and values of every earlier token at each step; it keeps them in memory, the **KV cache** (Module 04 covers it in full). That cache is the hidden cost of long conversations. For every token in the context, every layer stores a key vector and a value vector for every head. Add up the numbers for a real model and the cache can be bigger than you'd ever guess.",
    "Take Llama 3 8B's shape with ordinary multi-head attention, one key-value pair per query head: half a megabyte per token. An 8,192-token conversation would need 4.3 GB just for its cache, on top of 16 GB of weights. Serve a few users at once and the memory runs out long before the compute does. That's why almost every recent open model changes one detail of multi-head attention: several query heads **share** the same keys and values.",
    "Sharing a single key-value head across all the query heads is **multi-query attention** (Shazeer 2019); it's cheapest, but quality can suffer. **Grouped-query attention** (Ainslie et al. 2023) sits in between: groups of query heads share one key-value head each. Llama 3 8B uses 32 query heads and 8 key-value heads, a 4× smaller cache. In this step you'll compute cache sizes from real configurations, see what the saving buys on a real GPU, and implement GQA with the same trick real code uses: repeating the keys and values.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's measure. One key and one value vector per token, per layer, per key-value head, at 2 bytes per number. Here's the cache for Llama 3 8B's shape (32 layers, head width 128) with three choices of key-value heads, and for GPT-3:",
    },
    {
      kind: "table",
      caption: "KV cache, 16-bit numbers",
      columns: ["model and attention", "bytes per token", "GB at 8,192 tokens"],
      rows: [
        ["Llama 3 8B, multi-head (32 KV heads)", 524288, 4.29],
        ["Llama 3 8B as published, GQA (8 KV heads)", 131072, 1.07],
        ["Llama 3 8B, multi-query (1 KV head)", 16384, 0.13],
        ["GPT-3 175B, multi-head (96 KV heads)", 4718592, 38.65],
      ],
      source: "worked/gqa.py",
    },
    {
      kind: "text",
      text: "GPT-3, with ordinary multi-head attention, would need 4.7 MB per token (its own context limit was 2,048 tokens, still 9.7 GB). Llama 3 8B's published choice cuts its cache 4×. Here's how its query heads are grouped:",
    },
    {
      kind: "table",
      caption: "How Llama 3 8B's 32 query heads share 8 key-value heads",
      columns: ["query heads", "key-value head they read"],
      rows: [
        ["0–3", 0],
        ["4–7", 1],
        ["8–11", 2],
        ["12–15", 3],
        ["16–19", 4],
        ["20–23", 5],
        ["24–27", 6],
        ["28–31", 7],
      ],
      source: "worked/gqa.py",
    },
  ],
  concept: [
    {
      heading: "Keys and values pile up",
      paragraphs: [
        "During generation, each new token needs to attend to every earlier token, which means it needs their keys and values. Those never change once computed (the causal mask guarantees a token never looks forward), so models store them instead of recomputing them. The store grows by one key and one value per token, per layer, per key-value head.",
        "That makes the cache linear in four things: layers, key-value heads, head width and tokens. Model designers can't do much about the first and third without changing the model's capacity, and users want more tokens, not fewer. The number of key-value heads is the knob that's left, and that's exactly what GQA turns down. Keep in mind that the cache is per sequence: a server handling 20 conversations at once needs 20 caches.",
      ],
      formula: {
        expr: "KV cache bytes = 2 · L · H_kv · d_head · T · b",
        symbols: [
          { sym: "2", meaning: "one key and one value" },
          { sym: "L, H_kv, d_head", meaning: "layers, key-value heads and head width (32, 8, 128 for Llama 3 8B)" },
          { sym: "T", meaning: "tokens in the context" },
          { sym: "b", meaning: "bytes per number: 2 in 16-bit, 1 in 8-bit" },
        ],
        example: "Llama 3 8B: 2 · 32 · 8 · 128 · 8,192 · 2 = 1,073,741,824 bytes, 1 GiB.",
      },
      lab: { view: "gqa", label: "KV cache size", task: "Raise the context length, then switch between 32, 8 and 1 key-value heads. How long a context fits in 1 GB with each?" },
    },
    {
      heading: "Share them: multi-query and grouped-query attention",
      paragraphs: [
        "In multi-head attention every query head has its own keys and values. Multi-query attention (MQA) keeps all the query heads but gives them a *single* shared key-value head, so the cache shrinks by the number of heads, 32× for Llama 3 8B's shape. The cost is quality: every head must now compare its queries against the same keys, and models trained that way can lose accuracy and become less stable to train.",
        "Grouped-query attention is the compromise. Split the query heads into groups and give each group its own key-value head: with 8 groups of 4, Llama 3 8B's cache is 4× smaller than multi-head, and each head still has a choice of keys shared only with three neighbours. Ainslie et al. (2023) report that GQA reaches quality close to multi-head attention at a speed close to multi-query, and that an existing multi-head model can be converted by averaging its key-value heads into groups and training a little more (about 5% of the original pre-training compute). Llama 2 70B, Llama 3, Mistral 7B and many other open models use it.",
        "Notice what GQA does not change: the queries. Every head still computes its own attention pattern, so the model keeps most of the variety you saw in step 5; it's the things being compared against, keys and values, that are shared.",
      ],
      lab: { view: "kv-sharing", label: "Who shares what", task: "Switch between 32, 8, 4 and 1 key-value heads and watch the arrows from query heads to KV heads. Which setting is multi-head attention, and which is multi-query?" },
    },
    {
      heading: "What the saving buys",
      paragraphs: [
        "Memory saved in the cache turns directly into longer contexts or more users. Picture a 24 GB GPU running Llama 3 8B in 16-bit: the weights alone take about 16 GB, leaving roughly 8 GB for caches. With multi-head attention's 512 KB per token, that's about 15,000 tokens in total, shared by everyone the server is talking to. With GQA's 128 KB per token, it's about 60,000. Same model size, same hardware, four times the capacity.",
        "It also makes generation faster, not just smaller. Generating each token means reading the whole cache from memory, and on modern GPUs that reading, not the arithmetic, is usually the bottleneck. A 4× smaller cache means 4× less data to move per token. Module 16 builds on this with quantized caches (1 byte per number instead of 2) and paged cache memory, the techniques behind high-throughput servers like vLLM.",
        "GQA isn't the only way to shrink the cache. Mistral 7B combined it with sliding-window attention, where each layer attends only to the last 4,096 tokens, and DeepSeek-V2 compresses each token's keys and values into one small latent vector (multi-head latent attention). They all attack the same 2 · L · H_kv · d_head · T term from a different side.",
      ],
      mistake: "Thinking GQA makes the model smaller. The query and output projections are unchanged and only the K and V projections shrink, so parameters drop a little (about 10% of Llama 3 8B's block); the big saving is in the KV cache, which grows with every token of context.",
      lab: { view: "kv-budget", label: "Memory budget", task: "Set the GPU memory and see how many tokens of cache fit with multi-head attention and with GQA. How many 8,192-token conversations can the server hold at once?" },
    },
    {
      heading: "In code: repeat the keys and values",
      paragraphs: [
        "Implementations don't write a special attention for GQA. They compute the small set of key-value heads (8 for Llama 3 8B), store only those in the cache, and just before the attention product they *repeat* each key-value head once per query head in its group, so that query head h meets key-value head h ÷ 4. Hugging Face's Llama code calls this function `repeat_kv`; in NumPy it's one `np.repeat` along the head axis.",
        "Because the repeat happens after the cache, the memory saving is kept: what's stored is 8 heads, what's computed against is 32. Set the number of key-value heads equal to the number of query heads and the repeat does nothing, giving ordinary multi-head attention; set it to 1 and you have multi-query attention. One code path covers all three, which is why model configuration files just list `num_key_value_heads`.",
      ],
      lab: { view: "kv-repeat", label: "repeat_kv", task: "Pick the number of KV heads and follow the shapes: what's stored in the cache, what each query head reads, and which shape changes after the repeat." },
    },
  ],
  guided:
    "Before opening **KV cache size**, predict how much memory Llama 3 8B's cache needs for 8,192 tokens with multi-head attention. Then use **Memory budget** to find how many conversations of that length fit on a 24 GB GPU with GQA.",
  build: {
    id: "m03-gqa",
    title: "Size the KV cache and implement grouped-query attention",
    packages: ["numpy"],
    data: "m03",
    parts: [
      part("gqa", "p1", "Write the KV-cache size formula and reproduce Llama 3 8B's 1 GiB at 8,192 tokens.", [
        "One K and one V vector per token, layer and KV head: `2 * layers * kv_heads * d_head * tokens * bytes_per_number`.",
        "Llama 3 8B's head width is 4,096 / 32 = 128.",
      ]),
      part("gqa", "p2", "Repeat each key-value head for its group of query heads, the way Hugging Face's repeat_kv does.", [
        "`np.repeat(K, n_rep, axis=0)` repeats each KV head n_rep times in a row.",
        "After repeating, query head h lines up with KV head h // n_rep.",
      ]),
      part("gqa", "p3", "Run grouped-query attention, and check that equal head counts give ordinary multi-head attention.", [
        "`n_rep = Q.shape[0] // K.shape[0]`, then repeat K and V.",
        "Run `causal_attention(Q[h], K[h], V[h])` for every head and `np.stack` the results.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m03-gqa-saving",
      prompt: "Llama 3 8B has 32 query heads and 8 key-value heads. Compared with multi-head attention, what does that change?",
      options: [
        "The model has 4× fewer parameters",
        "The KV cache is 4× smaller, because groups of 4 query heads share one key and value head",
        "Each head attends to 4× fewer tokens",
        "Nothing; it is only a naming difference",
      ],
      correctIndex: 1,
      explanation: "Only 8 key-value heads are computed and cached; each is repeated for its 4 query heads at attention time.",
    },
    {
      id: "m03-gqa-mqa",
      prompt: "What is multi-query attention?",
      options: [
        "Attention with several queries per token",
        "The extreme case of sharing: all query heads use a single key-value head",
        "Running the model on several prompts at once",
        "Attention without a causal mask",
      ],
      correctIndex: 1,
      explanation: "MQA (Shazeer 2019) has one KV head; GQA uses an intermediate number; multi-head uses one per query head.",
    },
  ],
  oneSentence:
    "The KV cache stores a key and a value per token, layer and key-value head, so it can dwarf a model's other memory; grouped-query attention lets groups of query heads share key-value heads (8 for Llama 3 8B's 32), shrinking the cache 4× with little loss in quality.",
  deeper: [
    {
      label: "Ainslie et al. 2023, GQA",
      url: "https://arxiv.org/abs/2305.13245",
      adds: "Grouped-query attention, its quality and speed against MHA and MQA, and uptraining existing models.",
    },
    {
      label: "Shazeer 2019, Fast Transformer Decoding: One Write-Head is All You Need",
      url: "https://arxiv.org/abs/1911.02150",
      adds: "The multi-query attention paper, and why memory bandwidth limits generation.",
    },
    {
      label: "Hugging Face Llama implementation (repeat_kv)",
      url: "https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py",
      adds: "The real code: num_key_value_heads, repeat_kv and the attention forward pass.",
    },
  ],
};
