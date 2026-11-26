import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const qkv: DeepLesson = {
  why: [
    "Attention's job sounds simple: let each token gather information from the other tokens that matter to it. `loan` should pick up something from `bank`; `it` should pick up something from whatever \"it\" refers to. But how does a token decide which others matter, and what does it take from them?",
    "The transformer's answer is to give every token three different vectors, each made by multiplying its vector by a learned matrix. A **query** says what this token is looking for. A **key** says what this token offers to others who are looking. A **value** is the information it actually hands over. The match between my query and your key decides how much of your value I take. Think of a library: your query is the question in your head, each book's key is its catalogue card, and its value is what's written inside.",
    "That's the whole mechanism, and it's only a few lines of matrix maths: one product for the scores, a softmax to turn them into weights, and one more product to mix the values. In this step you'll build it from scratch, see a single query scored against three keys by hand, and measure why every implementation divides the scores by √d before the softmax, a detail that looks cosmetic but decides whether a model can be trained at all.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's score one query by hand. Three tokens, `the bank approved`, each with a made-up 4-number vector, and made-up 4 × 4 query and key matrices (real models learn them). Here's the query of `approved` against all three keys:",
    },
    {
      kind: "table",
      caption: "One query against three keys (toy vectors, d = 4)",
      columns: ["key token", "q · k", "÷ √4", "softmax weight"],
      rows: [
        ["the", 0.111, 0.055, 0.278],
        ["bank", 0.42, 0.21, 0.324],
        ["approved", 0.828, 0.414, 0.398],
      ],
      source: "worked/qkv.py",
    },
    {
      kind: "text",
      text: "The weights sum to 1, and `approved`'s output will be 0.278 of `the`'s value plus 0.324 of `bank`'s plus 0.398 of its own. Now, why the ÷ √d? Score 2,000 random queries against 8 random keys, with every component drawn with variance 1, and look at how spread out the scores are, and at how much weight the softmax gives its favourite key:",
    },
    {
      kind: "table",
      caption: "Why divide by √d: random scores over 8 keys",
      columns: ["d", "spread of raw scores (std)", "spread after ÷ √d", "top weight, raw", "top weight, ÷ √d"],
      rows: [
        [4, 2, 1, 0.524, 0.342],
        [16, 4.03, 1.01, 0.75, 0.358],
        [64, 8.01, 1, 0.873, 0.356],
        [256, 15.87, 0.99, 0.937, 0.359],
      ],
      source: "worked/qkv.py",
    },
  ],
  concept: [
    {
      heading: "Three roles for every token",
      paragraphs: [
        "Each attention head has three learned matrices, W_Q, W_K and W_V, each d_model × d_head (768 × 64 in GPT-2 small). Multiply the n × d_model matrix of token vectors by each one, and you get every token's query, key and value at once, three n × d_head matrices. Nothing about this is specific to a token's position or neighbours; it's the same three matrices for every token.",
        "Why not just compare the token vectors directly? Because \"what I'm looking for\" and \"what I contain\" are different things. A pronoun like `it` *contains* very little, but it's *looking for* a noun. A noun like `bank` contains a lot, and needs to advertise it. Separate matrices let the model learn a separate space for each role, and the values let it decide what to pass along independently of how it was found. In the original paper's words, attention maps a query and a set of key-value pairs to an output.",
        "In real code you'll rarely see three separate matrices. GPT-2 stores one fused 768 × 2,304 layer (`c_attn` in Hugging Face's implementation) that produces the queries, keys and values of all 12 heads in a single product, then splits the result into three, and each of those into 12 slices of 64. Same maths, fewer, bigger matrix products, which is what GPUs are fastest at.",
      ],
      lab: { view: "qkv-project", label: "Q, K and V", task: "Pick a token and compare its vector with its query, key and value. Same input, three different outputs: which matrix made which?" },
    },
    {
      heading: "Scores: how well each query matches each key",
      paragraphs: [
        "The match between token i's query and token j's key is their dot product, q_i · k_j: large when they point the same way, near zero when they're unrelated, negative when they point apart. Do that for every pair and you get the n × n score matrix S = Q Kᵀ, one matrix product for the whole sentence.",
        "Softmax then turns each row of scores into weights: exponentiate, divide by the row's total. The weights are positive and sum to 1, and because of the exponential, a score that's ahead by a little gets noticeably more weight, and one that's far ahead takes nearly all of it. Two practical details hide in every real implementation. First, subtract the row's largest score before exponentiating; it doesn't change the result, but it stops `exp` from overflowing. Second, the row is over *keys*: each query distributes exactly one unit of attention across the tokens it can see.",
      ],
      formula: {
        expr: "Attention(Q, K, V) = softmax(Q Kᵀ / √d_k) · V",
        symbols: [
          { sym: "Q, K, V", meaning: "the queries, keys and values of all n tokens: X·W_Q, X·W_K, X·W_V" },
          { sym: "Q Kᵀ", meaning: "the n × n table of every query's dot product with every key" },
          { sym: "d_k", meaning: "the width of one head's queries and keys (64 in GPT-2 small)" },
          { sym: "softmax", meaning: "applied to each row: weights over the keys that sum to 1" },
        ],
        example: "`approved`'s query against `the`, `bank`, `approved`: scores 0.111, 0.420, 0.828 → ÷ 2 → weights 0.278, 0.324, 0.398.",
      },
      lab: { view: "qkv", label: "Scores", task: "Click different query tokens and read their weights over every key. Toggle the √d scaling: what happens to the shape of the weights?" },
    },
    {
      heading: "Why divide by √d",
      paragraphs: [
        "Here's the subtle part. A dot product of two d-dimensional vectors adds up d products. If each component has variance 1, the sum has variance d, so the scores spread out like √d: in the worked example, a standard deviation of 2 at d = 4, but 8 at d = 64 and 16 at d = 256. Feed scores that spread into softmax and it saturates: at d = 256 the top key takes 94% of the weight on average, even though these vectors are random.",
        "A saturated softmax is a problem for training, not just for looks. When one weight is nearly 1 and the rest nearly 0, small changes to the scores barely change the weights, so the gradients that would teach the model to attend differently become tiny. Vaswani et al. gave exactly this reason for scaling. Dividing by √d brings the spread back to about 1 at any width, and the top weight stays near 0.36 whether d is 4 or 256. It's one division, and every transformer does it, usually folded into the query projection or the attention kernel.",
      ],
      mistake: "Dropping the √d scaling because the code still runs. It does run, but with wide heads the softmax saturates, gradients through attention almost vanish, and training stalls or becomes unstable.",
      lab: { view: "sqrt-d", label: "The √d effect", task: "Raise d and watch the raw scores spread out and the softmax lock onto one key. Then switch the scaling on: does width still matter?" },
    },
    {
      heading: "Mixing the values",
      paragraphs: [
        "The last step is the one that actually moves information. Token i's output is the weighted average of every token's value vector, using the weights from its row of the softmax. If `loan` puts 0.6 of its attention on `bank`, then 60% of what `loan` receives is `bank`'s value. Written for the whole sentence at once, it's another matrix product: the n × n weights times the n × d_head values.",
        "Because the weights are positive and sum to 1, every output lies *inside* the cloud of value vectors: attention can blend what's there, but it can't invent a direction no value points in. That's the job of the projections around it and the feed-forward network that follows (step 8). The output then goes through one more learned matrix, W_O, and is *added* to the token's vector (the residual connection, step 7), so each token keeps what it had and gains what it gathered.",
      ],
      lab: { view: "value-mix", label: "Mixing values", task: "Sharpen and soften the scores and watch the output move between the value vectors. Can you get the output outside the triangle?" },
    },
  ],
  guided:
    "Before opening **The √d effect**, predict how much weight softmax gives its top key at d = 256 without scaling. Then in **Mixing values**, try to push the output outside the triangle of values.",
  build: {
    id: "m03-qkv",
    title: "Build scaled dot-product attention from scratch",
    packages: ["numpy"],
    data: "m03",
    parts: [
      part("qkv", "p1", "Project every token into a query, a key and a value with three matrix products.", [
        "`X @ Wq` gives all the queries at once, one row per token.",
        "The three products differ only in the matrix: `return X @ Wq, X @ Wk, X @ Wv`.",
      ]),
      part("qkv", "p2", "Compute the scaled score matrix and a numerically stable softmax over each row.", [
        "`Q @ K.T / np.sqrt(Q.shape[1])` gives every score at once.",
        "Subtract `S.max(axis=1, keepdims=True)` before `np.exp`, then divide by the row sums.",
      ]),
      part("qkv", "p3", "Put it together: attention = softmax(QKᵀ/√d) V, and check that a dominant key copies its value.", [
        "Reuse your part 2 functions: `softmax_rows(scores(Q, K)) @ V`.",
        "Each output row is a weighted average of the rows of V.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m03-qkv-roles",
      prompt: "In attention, what decides how much of token j's value token i receives?",
      options: ["The distance between i and j", "How well i's query matches j's key (their scaled dot product, after softmax)", "How long j's value vector is", "The order the tokens were typed in"],
      correctIndex: 1,
      explanation: "The weight is softmax over q_i · k_j / √d. Values are what gets passed; queries and keys decide how much.",
    },
    {
      id: "m03-qkv-scale",
      prompt: "Why are attention scores divided by √d?",
      options: [
        "To make the model smaller",
        "Dot products of d-dimensional vectors spread out like √d; without scaling, softmax saturates and its gradients become tiny",
        "To make the weights sum to 1",
        "Because d is always 4",
      ],
      correctIndex: 1,
      explanation: "With unit-variance components a dot product has variance d. Scaling keeps the spread near 1 for any head width (Vaswani et al. 2017, §3.2.1).",
    },
  ],
  oneSentence:
    "Each token gets a query, a key and a value from three learned matrices; attention scores every query against every key with a dot product scaled by √d, turns each row into weights with softmax, and gives each token the weighted average of the values.",
  deeper: [
    {
      label: "Vaswani et al. 2017, §3.2",
      url: "https://arxiv.org/abs/1706.03762",
      adds: "The definition of scaled dot-product attention and the reason for the √d scaling.",
    },
    {
      label: "Jay Alammar: The Illustrated Transformer",
      url: "https://jalammar.github.io/illustrated-transformer/",
      adds: "Queries, keys and values drawn step by step, with the matrix shapes.",
    },
    {
      label: "3Blue1Brown: Attention in transformers, visually explained",
      url: "https://www.youtube.com/watch?v=eMlx5fFNoYc",
      adds: "A visual intuition for queries and keys as directions in space.",
    },
  ],
};
