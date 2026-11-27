import type { DeepLesson } from "../../../core/types";
import { localListing, part } from "./files";

export const recap: DeepLesson = {
  why: [
    "You've now met every piece of a transformer block on its own: position, queries and keys, the causal mask, multiple heads, residual connections, normalisation and the feed-forward network. Each made sense in isolation. But do you really know how they fit together? The honest test is to build the whole thing and check it against a real model, number for number.",
    "That's this step's mini-project. You'll write one complete GPT-2 block in plain NumPy, in the same weight layout GPT-2 itself uses, check it against a slow, independent reference, stack blocks into a full model, and count its parameters back to GPT-2 small's published 124,439,808. Then the \"Run it locally\" listing loads GPT-2's real weights into the very same code and compares the result with Hugging Face's implementation: they agree to within about 0.00004, on values as large as 235, the size of rounding error between 32-bit and 64-bit numbers.",
    "When the numbers match, you'll know something few users of language models do: there's nothing hidden inside the box. A model you call through an API runs the same few operations you'll write here, at a larger size, many times over. Module 04 adds the last step, turning the final vector into the next token.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's walk one GPT-2 small block, operation by operation, for our 12-token sentence. The shapes come and go; the parameters add up to the block total from step 1:",
    },
    {
      kind: "table",
      caption: "One GPT-2 small block, operation by operation",
      columns: ["operation", "shape out", "parameters"],
      rows: [
        ["LayerNorm 1", "(12, 768)", 1536],
        ["Q, K, V in one product, split into 12 heads", "3 × (12, 12, 64)", 1771776],
        ["scores, causal mask, softmax", "(12, 12, 12)", 0],
        ["weighted values, heads merged, output projection", "(12, 768)", 590592],
        ["add to the stream (residual)", "(12, 768)", 0],
        ["LayerNorm 2", "(12, 768)", 1536],
        ["feed-forward: widen, GELU, narrow", "(12, 3072) → (12, 768)", 4722432],
        ["add to the stream (residual)", "(12, 768)", 0],
        ["one block in total", "(12, 768)", 7087872],
      ],
      source: "worked/recap.py",
    },
    {
      kind: "text",
      text: "And here is the proof that these operations are the whole story: the same NumPy code, run with GPT-2 small's real weights, against the real model's own outputs (largest difference between any two of the 9,216 numbers):",
    },
    {
      kind: "table",
      caption: "Plain NumPy with GPT-2's real weights vs the real model",
      columns: ["compared after", "largest difference", "largest value"],
      rows: [
        ["block 1 output", 0.000024, 95.8],
        ["all 12 blocks + final LayerNorm", 0.000039, 235.5],
      ],
      source: "worked/recap.py",
    },
  ],
  concept: [
    {
      heading: "One block, in order",
      paragraphs: [
        "Here's the whole GPT-2 block as you'll write it. Normalise the stream with LayerNorm 1. Multiply by one d × 3d matrix to get every token's query, key and value at once, split them, and split each into 12 heads of 64. In each head, score every query against every key, scale by √64 = 8, mask the future with −∞, and softmax each row. Mix the values with those weights, merge the heads back to 768, apply the output projection, and add the result to the stream. Then normalise again with LayerNorm 2, widen to 3,072, apply GELU, narrow to 768, and add that to the stream too.",
        "Eight operations, two of which are just additions, and every one is a few lines of NumPy. The parameters fall where step 1 said they would: 1,771,776 in the fused Q, K, V projection, 590,592 in the output projection, 4,722,432 in the feed-forward network and 3,072 in the two norms, 7,087,872 in all. Part 1 writes the block and checks it against a deliberately slow reference that loops over heads and tokens one at a time, so any mistake in a reshape or a transpose shows up immediately.",
      ],
      lab: { view: "block-trace", label: "Block trace", task: "Step through the eight operations and watch the shape change. Which operations change the shape, and which only change the numbers?" },
    },
    {
      heading: "GPT-2's weights, by name",
      paragraphs: [
        "When you load a real checkpoint, the weights come as a dictionary of named arrays, and matching those names to the operations is half the work of reimplementing a model. In GPT-2's Hugging Face checkpoint, block 0's weights are `h.0.ln_1.weight` and `.bias` (LayerNorm 1's gain and bias), `h.0.attn.c_attn.weight` (768 × 2,304, the fused Q, K, V matrix), `h.0.attn.c_proj.weight` (the output projection), `h.0.ln_2.*`, and `h.0.mlp.c_fc.weight` and `h.0.mlp.c_proj.weight` (the feed-forward network's widening and narrowing matrices). Outside the blocks sit `wte` (the token table), `wpe` (the position table) and `ln_f` (the final norm).",
        "One detail trips up almost everyone: GPT-2's matrices are stored as in × out and used as `x @ W`, because OpenAI's original code used a 1×1 convolution (`Conv1D`) for its linear layers. Most other models store PyTorch `Linear` weights as out × in and compute `x @ W.T`. Load a Llama checkpoint with GPT-2's convention, or the reverse, and the shapes may even line up for square matrices while the results are garbage, which is why comparing against the reference implementation, as the listing does, is the only real test.",
      ],
      mistake: "Assuming every checkpoint stores its matrices the same way round. GPT-2's Conv1D weights are in × out (x @ W); PyTorch Linear weights are out × in (x @ W.T). Square matrices hide the mistake until you compare outputs.",
      lab: { view: "weight-names", label: "Weight names", task: "Match each of block 0's real weight names to the operation that uses it. Which weight is 768 × 2,304, and why that width?" },
    },
    {
      heading: "Checked against the real GPT-2",
      paragraphs: [
        "The Run-it-locally listing below does the one thing that settles every doubt: it loads GPT-2 small's real weights from Hugging Face, runs the forward pass with nothing but NumPy, and compares the result with what the library itself computes. After block 1, the largest difference among 9,216 numbers is 0.000024; after all 12 blocks and the final norm, 0.00004 or so. That's rounding error: the library computes in 32-bit floating point, the NumPy version in 64-bit, and differences at the fifth decimal place are exactly what that gap produces. A wrong mask, a missing √d, or an off-by-one position would show up as differences of 1 or more.",
        "Part 2 adds a check of its own that's worth remembering as a debugging technique. Run the stack on a 3-token input, then on the same 3 tokens followed by 2 more. With a correct causal mask, the outputs for the first 3 positions are identical, because no token can see the future. If they differ, something is leaking. That prefix property is also what makes the KV cache in Module 04 possible.",
      ],
      lab: { view: "block-check", label: "Real-model check", task: "Read the recorded comparison between plain NumPy and the real GPT-2. How large are the differences compared with the values themselves? What size of difference would mean a bug?" },
    },
    {
      heading: "What you've built, and what comes next",
      paragraphs: [
        "Put the pieces in order and you have GPT-2 small, exactly: a token table and a position table (Module 02 and step 2), 12 blocks of masked multi-head attention and a GELU feed-forward network wrapped in pre-norm residual connections (steps 3 to 8), and a final LayerNorm, 124,439,808 parameters in all, which part 3 counts from the weight shapes. Llama 3 changes the details (RoPE instead of a position table, RMSNorm, grouped-query attention, SwiGLU) and Mixtral swaps in experts, but the structure is the same.",
        "What's missing is the last step: turning the final vector at the last position into a choice of the next token. GPT-2 multiplies it by its own token table to get 50,257 logits, turns them into probabilities and picks one, then runs the whole stack again with that token appended. That's Module 04, along with the decoding rules and the KV cache that makes the repeat affordable.",
      ],
      lab: { view: "recap", label: "The whole stack", task: "Read the stack from the bottom up and say, for each line, which step of this module explained it. Which one would you find hardest to rebuild from memory?" },
    },
  ],
  guided:
    "Before you start part 1, predict the shape of the output of `c_attn` for a 12-token sentence. Then in **Real-model check**, decide how big a difference would have to be before you'd call it a bug.",
  build: {
    id: "m03-recap-block",
    title: "Mini-project: a complete GPT-2 block in NumPy",
    packages: ["numpy"],
    data: "m03",
    parts: [
      part("recap", "p1", "Write one complete GPT-2 block (pre-norm attention and feed-forward, each with a residual) in GPT-2's weight layout.", [
        "`qkv = layer_norm(x, ...) @ w[\"attn_w\"] + w[\"attn_b\"]`; `np.split(qkv, 3, axis=-1)` gives Q, K and V.",
        "Each head: `t.reshape(n, H, dh).transpose(1, 0, 2)`; mask with `np.triu(np.full((n, n), -np.inf), 1)` before the softmax.",
      ]),
      part("recap", "p2", "Stack blocks into a full model with token and position tables and a final norm, and confirm the causal prefix property.", [
        "`x = wte[ids] + wpe[:len(ids)]`, then `x = gpt2_block(x, w, H)` for every block.",
        "Finish with `layer_norm(x, lnf_g, lnf_b)`.",
      ]),
      part("recap", "p3", "List the shape of every weight in a block, and count GPT-2 small's 124,439,808 parameters from them.", [
        "Use the same 12 keys as `make_weights`; `attn_w` is `(d, 3 * d)`, `fc_w` is `(d, f)`.",
        "Total: `vocab * d + context * d + layers * block + 2 * d`.",
      ]),
    ],
  },
  local: [localListing("gpt2-block", "A complete GPT-2 forward pass in NumPy, with GPT-2's real weights", ["torch", "transformers"])],
  checks: [
    {
      id: "m03-recap-order",
      prompt: "In a GPT-2 (pre-norm) block, what is the order of operations?",
      options: [
        "Attention, then LayerNorm, then the feed-forward network, then LayerNorm",
        "x ← x + Attention(LayerNorm(x)); then x ← x + FFN(LayerNorm(x))",
        "The feed-forward network first, then attention",
        "LayerNorm only once, at the very end",
      ],
      correctIndex: 1,
      explanation: "Each sub-layer reads a normalised copy of the stream and adds its output back; one more LayerNorm follows the last block.",
    },
    {
      id: "m03-recap-check",
      prompt: "Your NumPy GPT-2 differs from Hugging Face's by at most 0.00004 on values up to 235. What does that tell you?",
      options: [
        "There is a small bug in the attention",
        "The implementations agree: differences at that size are rounding between 32-bit and 64-bit arithmetic",
        "The models use different weights",
        "The causal mask is missing",
      ],
      correctIndex: 1,
      explanation: "A real mistake (a missing mask, scale or position) produces differences of order 1 or more; 10⁻⁵ is floating-point rounding.",
    },
  ],
  oneSentence:
    "A GPT-2 block is eight operations (LayerNorm, fused Q/K/V, masked scaled softmax per head, merge and project, add; LayerNorm, widen-GELU-narrow, add) and, written in plain NumPy with GPT-2's real weights, it reproduces the real model to within rounding error.",
  deeper: [
    {
      label: "Karpathy: Let's reproduce GPT-2 (124M)",
      url: "https://www.youtube.com/watch?v=l8pRSuU81PU",
      adds: "Building GPT-2 from scratch in PyTorch and loading OpenAI's weights into it.",
    },
    {
      label: "Hugging Face GPT-2 implementation",
      url: "https://github.com/huggingface/transformers/blob/main/src/transformers/models/gpt2/modeling_gpt2.py",
      adds: "The reference code your NumPy version is checked against, including Conv1D.",
    },
    {
      label: "Radford et al. 2019, GPT-2 paper",
      url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf",
      adds: "The model description, including moving LayerNorm to the input of each sub-block.",
    },
  ],
};
