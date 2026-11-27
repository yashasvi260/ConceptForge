import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const moe: DeepLesson = {
  why: [
    "You've seen that the feed-forward network holds most of a block's parameters, and that those parameters appear to store much of what a model knows. So a bigger network should know more. But every parameter costs compute for every token: double the feed-forward network and you double the work of reading or writing each word. Is there a way to have the knowledge of a huge network at the price of a small one?",
    "**Mixture of Experts** (MoE) is that trick. Instead of one feed-forward network per block, keep several, called **experts**, and add a tiny **router** that looks at each token and sends it to only the best few. Each token pays for the experts it uses, but the model as a whole holds all of them. Mixtral 8x7B has 8 experts per block and sends each token to 2: about 46.7 billion parameters in total, of which only about 12.9 billion run for any one token. DeepSeek-V3 pushes the idea much further, with 671 billion parameters and 37 billion active.",
    "In this step you'll rebuild Mixtral's total and active parameter counts exactly from its published configuration, write a router and an MoE layer, and implement the load-balancing loss that stops all the tokens from piling onto one favourite expert. No MoE model is small enough to run in this page, so the router examples use made-up scores; every count is computed from the real configuration.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's count Mixtral 8x7B from its published configuration (d_model 4,096, 32 blocks, 8 key-value heads, expert width 14,336, 8 experts, 2 per token):",
    },
    {
      kind: "table",
      caption: "Mixtral 8x7B's parameters (published configuration)",
      columns: ["part", "parameters"],
      rows: [
        ["attention, one block", 41943040],
        ["one expert (a SwiGLU network)", 176160768],
        ["all 8 experts, one block", 1409286144],
        ["router, one block", 32768],
        ["whole model", 46702792704],
        ["used for one token (2 experts per block)", 12879925248],
      ],
      source: "worked/moe.py",
    },
    {
      kind: "text",
      text: "The counts match Mistral's own figures, 47B in total and 13B active. Notice the name is a little misleading: it isn't 8 × 7B = 56B, because attention, embeddings and norms are shared, and only the feed-forward networks are multiplied. Now one token's trip through a router, with made-up scores for 8 experts:",
    },
    {
      kind: "table",
      caption: "Routing one token to 2 of 8 experts (made-up router scores)",
      columns: ["expert", "router score", "softmax", "chosen", "weight"],
      rows: [
        [0, 1.2, 0.148, "", 0],
        [1, -0.3, 0.033, "", 0],
        [2, 2.1, 0.365, "yes", 0.55],
        [3, 0.4, 0.067, "", 0],
        [4, -1, 0.016, "", 0],
        [5, 1.9, 0.299, "yes", 0.45],
        [6, 0, 0.045, "", 0],
        [7, -0.5, 0.027, "", 0],
      ],
      source: "worked/moe.py",
    },
    {
      kind: "table",
      caption: "Load-balancing loss on two made-up batches (4 experts)",
      columns: ["batch", "Switch auxiliary loss"],
      rows: [
        ["every expert gets 2 of the 8 tokens", 1],
        ["every token goes to expert 0", 2.8],
      ],
      source: "worked/moe.py",
    },
  ],
  concept: [
    {
      heading: "More parameters, the same compute per token",
      paragraphs: [
        "An MoE block looks just like a normal block, except that its feed-forward network is replaced by a set of experts, each an ordinary feed-forward network with its own weights, plus a router. Attention, the norms and the residual connections are unchanged and shared by every token.",
        "The payoff is a split between two numbers that are normally the same: **total parameters**, which set how much the model can store, and **active parameters**, which set how much work each token costs. Mixtral 8x7B stores 46.7 billion parameters but each token uses 12.9 billion, 28% of them, so it runs at roughly the speed of a 13-billion-parameter dense model. Shazeer et al. (2017) introduced the sparsely gated version of the idea for language models, and Fedus et al. (2021) scaled it to over a trillion parameters with the Switch Transformer, which routes each token to a single expert.",
      ],
      formula: {
        expr: "active = shared + k · expert          total = shared + E · expert          (per block)",
        symbols: [
          { sym: "shared", meaning: "attention, router and norms: every token uses them" },
          { sym: "expert", meaning: "one expert's parameters: 3 · d · f for a SwiGLU expert" },
          { sym: "E, k", meaning: "experts per block (8 in Mixtral) and experts used per token (2)" },
        ],
        example: "Mixtral, per block: 41,943,040 + 32,768 + 8,192 shared; 176,160,768 per expert; 8 stored, 2 used.",
      },
      lab: { view: "moe-params", label: "Total vs active", task: "Change the number of experts and how many each token uses. Which number grows with the experts, and which with the experts per token?" },
    },
    {
      heading: "The router picks experts for each token",
      paragraphs: [
        "The router is just one small matrix, d_model × E (4,096 × 8 in Mixtral, 32,768 parameters). Multiply a token's vector by it and you get one score per expert. Keep the top k scores, turn them into weights with a softmax over just those k, run only the chosen experts, and add their outputs together with those weights. In the worked example, experts 2 and 5 win with scores 2.1 and 1.9, and get weights 0.55 and 0.45.",
        "Routing happens independently for every token in every block, so a single sentence can visit many different experts. What do the experts specialise in? Less than the name suggests. In their analysis of Mixtral, Jiang et al. (2024) found no obvious pattern in which experts handle which topics (mathematics, biology, philosophy); the assignments looked more related to syntax, and consecutive tokens were often sent to the same experts. \"Expert\" is a name for a slot the router learns to use, not a subject specialist someone designed.",
      ],
      formula: {
        expr: "s = x · W_router          top = the k largest of s          y = Σ_{i ∈ top} softmax(s_top)_i · Expert_i(x)",
        symbols: [
          { sym: "W_router", meaning: "the router's matrix, d × E" },
          { sym: "s", meaning: "one score per expert for this token" },
          { sym: "softmax(s_top)", meaning: "weights over only the chosen experts, summing to 1" },
        ],
        example: "Scores 2.1 (expert 2) and 1.9 (expert 5) → weights 0.55 and 0.45; the other six experts don't run.",
      },
      mistake: "Thinking each expert is a specialist in a topic, like a legal expert or a code expert. Routing is learned per token and per block, and in Mixtral the experts show no clear topic specialisation.",
      lab: { view: "moe-router", label: "The router", task: "Pick a token and change how many experts it may use. Which experts run? How do the weights change when k goes from 1 to 2? (Router scores are made up.)" },
    },
    {
      heading: "Keeping every expert busy",
      paragraphs: [
        "Left alone, routing tends to collapse. Early in training, a few experts happen to be slightly better, so the router sends them more tokens, so they learn more and get better still, while the others are starved and stay useless. Worse, uneven routing wastes hardware: experts usually sit on different GPUs, and one overloaded expert keeps all the others waiting.",
        "The usual fix is an extra term in the training loss that rewards even routing. The Switch Transformer's version multiplies, for each expert, the share of tokens it actually received by the router's average probability for it, sums over the experts and scales by the number of experts. That's exactly 1.0 when routing is perfectly even and grows as it concentrates: 2.8 in the worked example, where every token goes to one of 4 experts. It's added with a small weight (0.01 in the Switch Transformer paper), so it nudges routing without overriding the main training objective. Systems also cap how many tokens one expert may take in a batch (its capacity), and tokens over the cap skip the experts and pass through on the residual connection.",
      ],
      lab: { view: "moe-balance", label: "Load balancing", task: "Skew the routing towards one expert and watch the balancing loss rise. What value does it take when routing is perfectly even?" },
    },
    {
      heading: "What MoE costs: memory",
      paragraphs: [
        "MoE saves compute, not memory. Every expert has to be loaded, because any token might need any of them, so Mixtral needs room for all 46.7 billion parameters, about 93 GB in 16-bit, even though each token touches only 12.9 billion. A dense model with the same per-token compute would need about 26 GB. That's why MoE models shine on servers with many GPUs and lots of memory, and are awkward on a single consumer GPU, where quantization (Module 16) or offloading experts to CPU memory becomes necessary.",
        "There are subtler costs too. Routing adds communication when experts live on different GPUs, fine-tuning can be less stable, and a batch of tokens all wanting the same expert can create hot spots. In exchange, MoE models reach the quality of much larger dense models at a fraction of the compute per token, which is why many of today's largest open models use them. When you read a model card, check both numbers: the total tells you how much memory you need, the active count tells you roughly how fast it will run and how much each token costs.",
      ],
      lab: { view: "moe-memory", label: "Memory vs compute", task: "Compare Mixtral with a dense model that does the same work per token. How much memory does each need? Which would fit on a 24 GB GPU?" },
    },
  ],
  guided:
    "Before opening **Total vs active**, predict Mixtral's total if it had 16 experts instead of 8. Then in **Load balancing**, find the routing that gives a loss of exactly 1.0.",
  build: {
    id: "m03-moe",
    title: "Count Mixtral, and build a router with load balancing",
    packages: ["numpy"],
    data: "m03",
    parts: [
      part("moe", "p1", "Compute Mixtral 8x7B's total and active parameters from its published configuration, exactly.", [
        "Per block, the shared part is attention (`2*d*d + 2*d*kv`), the router (`d*E`) and two norms (`2*d`); each expert is `3*d*ffn`.",
        "Outside the blocks: a final norm (d) and two vocab × d tables (token table and output head).",
      ]),
      part("moe", "p2", "Route each token to its top-k experts with renormalised weights, and build the MoE layer.", [
        "`top = np.argsort(-scores)[:k]`, then a softmax over `scores[top]`.",
        "For each row x: `sum(w * experts[j](x) for j, w in zip(top, weights))`.",
      ]),
      part("moe", "p3", "Implement the Switch Transformer's load-balancing loss: 1.0 for even routing, higher when tokens pile onto a few experts.", [
        "fᵢ: `np.bincount(chosen, minlength=n_experts) / len(chosen)`. Pᵢ: `probs.mean(axis=0)`.",
        "The loss is `n_experts * (f * P).sum()`.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m03-moe-active",
      prompt: "Mixtral 8x7B has about 46.7B parameters but uses about 12.9B per token. Why?",
      options: [
        "It is quantized",
        "Each block has 8 expert feed-forward networks, but the router sends each token through only 2 of them",
        "It skips half of its layers",
        "Attention is turned off for most tokens",
      ],
      correctIndex: 1,
      explanation: "Attention, norms and embeddings are used by every token; of the experts, only the top 2 per block run.",
    },
    {
      id: "m03-moe-memory",
      prompt: "What does Mixture of Experts save, compared with a dense model of the same total size?",
      options: [
        "Memory, because unused experts are not stored",
        "Compute per token, because only a few experts run; all experts must still be kept in memory",
        "Nothing",
        "Training data",
      ],
      correctIndex: 1,
      explanation: "Any token might need any expert, so all of them must be loaded; the saving is in the work done per token.",
    },
  ],
  oneSentence:
    "A Mixture-of-Experts block replaces its feed-forward network with several experts and a router that sends each token to only the top few, so the model stores far more parameters than each token uses (Mixtral 8x7B: 46.7B total, 12.9B active), at the cost of memory for every expert and a loss term to keep routing balanced.",
  deeper: [
    {
      label: "Jiang et al. 2024, Mixtral of Experts",
      url: "https://arxiv.org/abs/2401.04088",
      adds: "Mixtral's architecture, results, and an analysis of which tokens go to which experts.",
    },
    {
      label: "Fedus et al. 2021, Switch Transformers",
      url: "https://arxiv.org/abs/2101.03961",
      adds: "Top-1 routing, the load-balancing loss, expert capacity, and scaling to over a trillion parameters.",
    },
    {
      label: "Hugging Face blog: Mixture of Experts Explained",
      url: "https://huggingface.co/blog/moe",
      adds: "A practical overview of MoE training, serving and fine-tuning.",
    },
  ],
};
