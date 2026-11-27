import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const multiHead: DeepLesson = {
  why: [
    "One attention head produces one set of weights per token: a single answer to \"where should I look?\" But a token often needs several answers at once. ` loan` might want the word just before it (for grammar), the subject of the sentence (for meaning), and a related noun further back (`bank`). One softmax can't point strongly in three directions; making one weight bigger makes the others smaller.",
    "So transformers run several heads side by side. The token vectors are split into slices, each head attends with its own queries, keys and values on its own slice, and the results are glued back together and mixed by one more matrix. GPT-2 small uses 12 heads of 64 numbers each; Llama 3 8B uses 32 heads of 128. And here's the part that surprises most people: splitting into heads costs nothing extra. The projection matrices have exactly the same size whether you use 1 head or 48; you just slice them differently.",
    "In this step you'll write the split and merge, build multi-head attention and check it against a head-by-head reference, look at where the 12 real heads of one GPT-2 layer point, and then ask an awkward question with real measurements: if you switch GPT-2's heads off one at a time, how many does it actually miss?",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's split GPT-2 small's 768 numbers into different numbers of heads, for our 12-token sentence. Watch which column changes and which doesn't:",
    },
    {
      kind: "table",
      caption: "Splitting GPT-2 small's 768 numbers into heads",
      columns: ["heads", "numbers per head", "attention parameters (Q, K, V, O)", "attention weights per layer, 12 tokens"],
      rows: [
        [1, 768, 2362368, 144],
        [2, 384, 2362368, 288],
        [12, 64, 2362368, 1728],
        [48, 16, 2362368, 6912],
      ],
      source: "worked/multi-head.py",
    },
    {
      kind: "text",
      text: "The parameters never change; only the number of separate weight tables does. Now the real thing: in GPT-2's layer 2, here's where ` loan` puts its attention in each of the 12 heads, its favourite key, and its favourite key other than the first token:",
    },
    {
      kind: "table",
      caption: "Where ' loan' looks in the 12 real heads of layer 2",
      columns: ["head", "top key", "its weight", "top key after the first", "weight after the first"],
      rows: [
        [0, "'The'", 0.5, "' approved'", 0.252],
        [1, "'The'", 0.528, "' bank'", 0.242],
        [2, "' the'", 0.444, "' the'", 0.444],
        [3, "'The'", 0.389, "' the'", 0.345],
        [4, "' the'", 0.357, "' the'", 0.357],
        [5, "' approved'", 0.323, "' approved'", 0.323],
        [6, "'The'", 0.854, "' the'", 0.061],
        [7, "' loan'", 0.359, "' loan'", 0.359],
        [8, "' approved'", 0.593, "' approved'", 0.593],
        [9, "' approved'", 0.271, "' approved'", 0.271],
        [10, "'The'", 0.399, "' loan'", 0.24],
        [11, "'The'", 0.731, "' loan'", 0.105],
      ],
      source: "worked/multi-head.py",
    },
    {
      kind: "text",
      text: "Different heads, different targets: the previous word, the verb, `bank`, itself. Finally, the awkward question. Switch off one head at a time (zero its output) and measure GPT-2's average next-token loss on 8 sentences:",
    },
    {
      kind: "table",
      caption: "Switching off one GPT-2 head at a time (8 sentences)",
      columns: ["measurement", "value"],
      rows: [
        ["average loss with every head", 4.0468],
        ["heads whose removal adds less than 0.01", 78],
        ["heads whose removal adds less than 0.05", 129],
        ["heads whose removal adds more than 0.1", 8],
        ["most important: layer 0, head 10", 0.4859],
        ["the previous-token head, layer 4, head 11", 0.0053],
        ["least important: layer 1, head 10", -0.0343],
      ],
      source: "worked/multi-head.py",
    },
  ],
  concept: [
    {
      heading: "One head is one weighting",
      paragraphs: [
        "Remember what a head produces: for each token, one row of weights that sums to 1. That's a single distribution, so it forces a trade-off. If ` loan` gives 0.6 to the previous word, at most 0.4 is left for everything else. A model with only one head would have to choose, at every layer, between attending for grammar, for meaning, or for position.",
        "Multiple heads remove the trade-off. Each head has its own query, key and value projections, so it can learn its own notion of relevance, and each computes its own softmax. One head can put almost all its weight on the previous token while another spreads out over the nouns. The lab's four heads are designed by hand to show four such behaviours side by side; the real ones, further down, are messier.",
      ],
      lab: { view: "multihead", label: "Four heads", task: "Compare the four heatmaps for the same sentence. Could a single head produce all four patterns at once? Why not? (These heads are illustrative.)" },
    },
    {
      heading: "Split, attend, concatenate, mix",
      paragraphs: [
        "In code, multi-head attention is reshaping, not extra machinery. Project the n × d token matrix with one d × d matrix each for Q, K and V. Reshape each result to n × H × d/H and move the head axis first, giving H separate n × d/H matrices. Run ordinary attention in each head, in parallel, as one batched operation. Then reverse the reshape (concatenate the heads back into n × d) and multiply by an output matrix W_O, d × d, which lets the heads' results mix.",
        "That's why the parameter count doesn't depend on H: Q, K, V and W_O are d × d whether you slice them into 1 head or 48. What does change is the shape of the computation. More heads mean more separate softmaxes, each over a narrower slice, so each head is cheaper but sees less. Fewer heads mean fewer, richer comparisons. Published models settle on head widths of 64 or 128, and set the number of heads from the model's width: d / 64 = 12 for GPT-2 small, d / 128 = 32 for Llama 3 8B.",
      ],
      formula: {
        expr: "headₕ = Attention(X W_Qʰ, X W_Kʰ, X W_Vʰ)          MultiHead(X) = Concat(head₁, …, head_H) · W_O",
        symbols: [
          { sym: "W_Qʰ, W_Kʰ, W_Vʰ", meaning: "head h's slice of the query, key and value projections: d × d/H each" },
          { sym: "Concat", meaning: "glue the H outputs back side by side: n × d" },
          { sym: "W_O", meaning: "the output projection, d × d, which mixes the heads' results" },
        ],
        example: "GPT-2 small: 12 heads × 64 numbers = 768; Q, K, V and O have 2,362,368 parameters whatever the split.",
      },
      mistake: "Thinking each head reads a different part of the sentence. Every head sees every token; what differs is the slice of each token's vector, and the learned projections that decide what that head compares.",
      lab: { view: "head-split", label: "Splitting into heads", task: "Change the number of heads for GPT-2 small's width. Which numbers change and which stay fixed? What happens to the width of each head?" },
    },
    {
      heading: "Twelve real heads in one layer",
      paragraphs: [
        "So what do real heads do with their freedom? In GPT-2's layer 2, ` loan`'s twelve heads point in genuinely different directions: three favour ` approved`, the verb; two favour the ` the` right before it; head 7 looks mostly at ` loan` itself; and head 1, after the first token, gives 24% to ` bank`. Several heads also park a large share on the first token, the attention sink from step 4.",
        "Higher up, the picture changes. In layers 5 to 8 and layer 10, every one of ` loan`'s twelve heads has the first token as its favourite key, and in layers 9 and 11 all but one do. That doesn't mean those layers do nothing: a head can put most of its weight on the sink and still move useful information with the rest. But it's a good reminder that real heads don't come with labels, and that the clean \"one head per job\" story is an idealisation.",
      ],
      lab: { view: "head-grid", label: "Real heads, one layer", task: "Step through the layers for the same token. In which layers do the heads disagree most? Where does every head stare at the first token?" },
    },
    {
      heading: "Do we need every head?",
      paragraphs: [
        "Here's a real experiment you can reproduce. Switch off one head (zero its slice before the output projection), measure GPT-2's next-token loss on 8 sentences, put the head back, and repeat for all 144. The result: 78 heads raise the loss by less than 0.01, on a baseline of 4.05, and 129 by less than 0.05. Only 8 heads cost more than 0.1, mostly in layer 0, and the single most important, layer 0's head 10, costs 0.49. A few removals even make the loss slightly *better*.",
        "Michel et al. (2019) found the same pattern at larger scale (their paper is titled \"Are Sixteen Heads Really Better than One?\"): many heads can be removed individually with little loss, which is a basis for pruning. But read the result carefully. Removing heads one at a time hides redundancy: two heads that back each other up each look unimportant alone. The previous-token head costs only 0.005 alone, yet it's a known building block of in-context copying. And 8 short sentences are a small test. Quality on real tasks needs a real evaluation (Module 17).",
      ],
      lab: { view: "head-ablation", label: "Switching heads off", task: "Find the heads that hurt most when removed. Which layer are they in? Then find the previous-token head, layer 4 head 11: why might it look unimportant here?" },
    },
  ],
  guided:
    "Before opening **Splitting into heads**, predict whether 48 heads need more parameters than 12. Then in **Switching heads off**, guess which layer holds the most important heads before you look.",
  build: {
    id: "m03-multi-head",
    title: "Build multi-head attention, and test GPT-2's heads one by one",
    packages: ["numpy"],
    data: "m03",
    parts: [
      part("multi-head", "p1", "Split a matrix of token vectors into heads and merge them back.", [
        "`X.reshape(n, H, d // H)` cuts each row into H slices; `.transpose(1, 0, 2)` puts the head axis first.",
        "Merging is the reverse: `Z.transpose(1, 0, 2).reshape(n, H * dh)`.",
      ]),
      part("multi-head", "p2", "Assemble causal multi-head attention and check it against a head-by-head reference.", [
        "Split each of `X @ Wq`, `X @ Wk`, `X @ Wv` into heads, attend per head with `causal_attention`, then `np.stack`.",
        "Finish with `merge_heads(Z) @ Wo`.",
      ]),
      part("multi-head", "p3", "Read GPT-2's real head-ablation results: find the most important head and count the cheap ones.", [
        "`np.unravel_index(np.argmax(a), a.shape)` turns the position of the maximum into (layer, head).",
        "`(a < threshold).sum()` counts the heads below a threshold.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m03-mha-params",
      prompt: "GPT-2 small switches from 12 heads of 64 numbers to 24 heads of 32. What happens to its attention parameters?",
      options: ["They double", "They halve", "Nothing: Q, K, V and W_O stay d × d; only the slicing changes", "They grow with the number of tokens"],
      correctIndex: 2,
      explanation: "Heads are slices of the same d × d projections, so the parameter count is independent of the number of heads.",
    },
    {
      id: "m03-mha-ablation",
      prompt: "Switching off most single GPT-2 heads barely changes its loss. What is the most careful conclusion?",
      options: [
        "Those heads are useless and can always be deleted",
        "Many heads are individually redundant on this test, but heads can back each other up, so removing several, or testing other tasks, can tell a different story",
        "Multi-head attention is a mistake",
        "Only layer 0 matters",
      ],
      correctIndex: 1,
      explanation: "One-at-a-time ablation hides redundancy between heads, and 8 short sentences are a narrow test; Michel et al. (2019) found pruning many heads together eventually hurts.",
    },
  ],
  oneSentence:
    "Multi-head attention slices each token's vector into H parts, runs a separate attention with its own softmax in each, then concatenates the results and mixes them with W_O, at no extra parameter cost; real heads point in different directions, and many can be removed individually with little loss.",
  deeper: [
    {
      label: "Michel et al. 2019, Are Sixteen Heads Really Better than One?",
      url: "https://arxiv.org/abs/1905.10650",
      adds: "Head-ablation and pruning experiments showing many heads are individually redundant.",
    },
    {
      label: "Voita et al. 2019, Analyzing Multi-Head Self-Attention",
      url: "https://arxiv.org/abs/1905.09418",
      adds: "Which heads specialise (positional, syntactic, rare words) and which can be pruned.",
    },
    {
      label: "Vaswani et al. 2017, §3.2.2",
      url: "https://arxiv.org/abs/1706.03762",
      adds: "The original definition of multi-head attention.",
    },
  ],
};
