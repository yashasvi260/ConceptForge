import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const residualNorm: DeepLesson = {
  why: [
    "You now know what attention computes. But look again at how a block uses it: the result isn't what the token *becomes*, it's what gets *added* to the token. `x ← x + Attention(…)`. That small plus sign, the **residual connection**, is one of the most important ideas in deep learning, and it's the reason a transformer can be 12 blocks deep, or 96.",
    "Think of the token's vector as a shared notebook that runs up through the whole model, usually called the **residual stream**. Each block reads the notebook, writes a few notes, and passes it on; nothing is erased. Early blocks can leave information for late ones, and if a block has nothing useful to say, it can write almost nothing and the stream passes through untouched. That's also what makes deep stacks trainable: the learning signal has a direct path back to the very first block.",
    "The other ingredient keeps all that adding under control: **normalisation**. Each sub-layer first rescales its input to a standard size (LayerNorm in GPT-2, RMSNorm in Llama), so it always sees numbers in a sensible range however large the stream has grown. In this step you'll measure how long real GPT-2 vectors get as they climb the stream (one of them grows more than 300×), implement both norms, and compare the two ways of ordering normalisation and the residual.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's follow the length of real GPT-2 vectors up the residual stream, for the first token `The`, the second token ` bank`, and the last token ` income`:",
    },
    {
      kind: "table",
      caption: "Vector length along GPT-2's residual stream (real)",
      columns: ["stage", "'The'", "' bank'", "' income'"],
      rows: [
        ["token + position vectors", 10.1, 6.1, 5.1],
        ["after block 1", 132.8, 57.1, 55.6],
        ["after block 2", 636.2, 57.3, 57.3],
        ["after block 3", 2563.8, 65.3, 63.2],
        ["after block 6", 2990.5, 88.4, 84.4],
        ["after block 9", 3100.9, 143.8, 134.4],
        ["after block 11", 3112.4, 236, 218],
        ["after block 12 and the final LayerNorm", 78.1, 202.8, 262.7],
      ],
      source: "worked/residual-norm.py",
    },
    {
      kind: "text",
      text: "Ordinary tokens grow steadily as each block adds to them, from about 5 to over 200. The first token explodes to over 3,000 within three blocks, then the final LayerNorm squashes it to 78. Now see what LayerNorm does to one real vector, the input to GPT-2's very first LayerNorm for ` approved`:",
    },
    {
      kind: "table",
      caption: "GPT-2's first LayerNorm on one real vector (' approved')",
      columns: ["stage", "mean of its 768 numbers", "standard deviation"],
      rows: [
        ["before LayerNorm", -0.0024, 0.2046],
        ["after subtracting the mean and dividing by the std", 0, 0.9999],
        ["after GPT-2's learned gain and bias", -0.0055, 0.1107],
      ],
      source: "worked/residual-norm.py",
    },
    {
      kind: "table",
      caption: "LayerNorm vs RMSNorm on a small vector",
      columns: ["", "x₁", "x₂", "x₃", "x₄"],
      rows: [
        ["input x", 2, -1, 0.5, 8],
        ["LayerNorm(x)", -0.11, -0.988, -0.549, 1.646],
        ["RMSNorm(x)", 0.481, -0.24, 0.12, 1.923],
      ],
      source: "worked/residual-norm.py",
    },
  ],
  concept: [
    {
      heading: "Residual connections: add, don't replace",
      paragraphs: [
        "Every sub-layer in a transformer block is wrapped the same way: compute something from the current vector, then add it back. After attention, `x = x + attn(…)`; after the feed-forward network, `x = x + ffn(…)`. So the vector that leaves block 12 is the original token-plus-position vector plus twenty-four updates, two per block, all added together.",
        "That's why the stream grows: the real numbers above show an ordinary token's vector going from about 5 to over 200 as updates accumulate. And it's why researchers who study model internals think of the stream as a shared workspace: any block can read what any earlier block wrote, because it's all still there, summed in one vector. The first token is a special case. Its vector grows past 3,000 in the first three blocks, a phenomenon Sun et al. (2024) call **massive activations**: a few huge values that models use, together with attention sinks (step 4), as a kind of fixed reference point.",
      ],
      lab: { view: "stream-norms", label: "Residual stream", task: "Pick a token and follow its vector's length up all 12 blocks. Which token behaves completely differently, and what happens to it at the very end?" },
    },
    {
      heading: "Why the residual path makes depth trainable",
      paragraphs: [
        "Before residual connections, very deep networks were hard to train, and not because of a lack of data. When each layer *replaces* its input, the learning signal travelling backwards gets multiplied by every layer's local slope on the way. Multiply 50 numbers a bit below 1 and you get almost nothing (the signal vanishes); a bit above 1 and it explodes. He et al. (2015) showed that adding the input back, so each layer only learns a *change*, fixes this: the identity path carries the signal straight through, and each layer's contribution is added on top.",
        "There's a second benefit. A new block that hasn't learned anything yet can output almost nothing, and the stream passes through unchanged. So adding depth can't make the starting point worse, and training can gradually give each block something useful to do. That's why transformers are built from many identical residual blocks rather than one huge layer.",
      ],
      lab: { view: "residual-depth", label: "Depth and signal", task: "Set how much each layer shrinks or grows the signal, then add layers. Without the residual path, how many layers until the signal is gone? With it?" },
    },
    {
      heading: "LayerNorm and RMSNorm",
      paragraphs: [
        "Because the stream keeps growing, the numbers a sub-layer receives could be tiny early on and huge later. Normalisation puts them back on a standard scale first. **LayerNorm** works on each token's vector separately: subtract its mean, divide by its standard deviation, then multiply by a learned gain and add a learned bias, one of each per dimension. In the worked example, GPT-2's first LayerNorm takes a real vector with standard deviation 0.20 to exactly 1, and then its learned gain scales it to 0.11.",
        "**RMSNorm** (Zhang & Sennrich 2019) drops two steps: no mean subtraction and no bias, just divide by the root mean square and multiply by a gain. The authors found the re-centring wasn't needed for good results, and RMSNorm is simpler and cheaper; they reported running-time reductions of 7% to 64% across models. Llama, Mistral and most recent open models use it. Look at the small example: LayerNorm shifts the numbers so they're centred on 0 (three of four become negative), while RMSNorm keeps every sign and every ratio, and only changes the scale.",
      ],
      formula: {
        expr: "LayerNorm(x) = (x − mean(x)) / √(var(x) + ε) · g + b          RMSNorm(x) = x / √(mean(x²) + ε) · g",
        symbols: [
          { sym: "x", meaning: "one token's vector (768 numbers in GPT-2 small)" },
          { sym: "mean, var", meaning: "computed over that vector's own numbers, not across tokens" },
          { sym: "g, b", meaning: "a learned gain and bias per dimension (RMSNorm has no bias)" },
          { sym: "ε", meaning: "a tiny constant (10⁻⁵ in GPT-2) that avoids dividing by zero" },
        ],
        example: "[2, −1, 0.5, 8] → LayerNorm [−0.110, −0.988, −0.549, 1.646], RMSNorm [0.481, −0.240, 0.120, 1.923].",
      },
      mistake: "Normalising across the tokens of a batch, as batch normalisation does in image models. LayerNorm and RMSNorm normalise each token's own vector, so a token's result never depends on the other tokens or the batch.",
      lab: { view: "norm", label: "LayerNorm vs RMSNorm", task: "Type a vector, then add a large constant to every number. Which norm's output changes, and which doesn't? Why?" },
    },
    {
      heading: "Pre-norm: normalise the input, not the stream",
      paragraphs: [
        "Where does the norm go? The original Transformer (2017) normalised *after* adding: `x = Norm(x + attn(x))`. That's **post-norm**, and it normalises the stream itself at every step. GPT-2 moved the norm to the *input* of each sub-layer and added one final norm after the last block: `x = x + attn(Norm(x))`. That's **pre-norm**, and almost every large model since uses it.",
        "The difference matters for training. With pre-norm, the residual path is a clean identity from bottom to top, nothing rescales it, and Xiong et al. (2020) showed this lets models train stably without the careful learning-rate warm-up that post-norm needs. The price is the stream's growth you saw above, which is why pre-norm models need that **final** norm before the output: it's what brings the first token from 3,112 back down to 78. Part 3 builds both orders and shows that an empty pre-norm block passes its input through untouched, while post-norm changes it even when the sub-layers do nothing. Some recent models combine the two: Gemma 2 applies RMSNorm to both the input and the output of every sub-layer.",
      ],
      lab: { view: "pre-post", label: "Pre-norm vs post-norm", task: "Switch between the two orders and follow the path of the residual stream. In which one does the stream itself get normalised at every block?" },
    },
  ],
  guided:
    "Before opening **Residual stream**, predict which token's vector will grow the most. Then in **Depth and signal**, find the number of layers at which the signal without residuals drops below 1% of where it started.",
  build: {
    id: "m03-residual-norm",
    title: "Implement the norms, measure the real residual stream, and order a block",
    packages: ["numpy"],
    data: "m03",
    parts: [
      part("residual-norm", "p1", "Implement LayerNorm and RMSNorm over each token's vector, with a learned gain (and bias for LayerNorm).", [
        "Use `axis=-1, keepdims=True` so each row (token) is normalised on its own.",
        "RMSNorm: `x / np.sqrt((x ** 2).mean(axis=-1, keepdims=True) + eps) * gain`.",
      ]),
      part("residual-norm", "p2", "Find the token whose real GPT-2 vector grows the most along the residual stream, and measure what the final LayerNorm does to it.", [
        "Divide stage 11 by stage 0 for every token: `norms[11] / norms[0]`.",
        "The final norm's effect is stage 11 divided by stage 12.",
      ]),
      part("residual-norm", "p3", "Write a pre-norm and a post-norm block, and show that only pre-norm leaves the stream untouched when the sub-layers output nothing.", [
        "Pre-norm: `x = x + attn(norm(x))`, then `return x + ffn(norm(x))`.",
        "Post-norm: `x = norm(x + attn(x))`, then `return norm(x + ffn(x))`.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m03-res-why",
      prompt: "Why do transformer blocks add their output to their input instead of replacing it?",
      options: [
        "To save memory",
        "The identity path carries information and the learning signal straight through, so very deep stacks can be trained and each block only learns a change",
        "To make the vectors shorter",
        "Because attention can only output zeros",
      ],
      correctIndex: 1,
      explanation: "Residual connections (He et al. 2015) avoid vanishing and exploding signals across many layers, and let every block read what earlier blocks wrote.",
    },
    {
      id: "m03-res-rms",
      prompt: "What does RMSNorm leave out compared with LayerNorm?",
      options: ["The division", "Subtracting the mean (and the bias); it only rescales by the root mean square", "The learned gain", "Nothing; they are the same"],
      correctIndex: 1,
      explanation: "RMSNorm keeps every sign and ratio of the vector and only changes its scale; it is cheaper and works as well in practice (Zhang & Sennrich 2019).",
    },
  ],
  oneSentence:
    "Each sub-layer adds its output to a residual stream that runs through the whole model, which keeps deep stacks trainable and lets later blocks read earlier ones; pre-norm models rescale each sub-layer's input with LayerNorm or RMSNorm and normalise once more at the end, since the stream itself keeps growing.",
  deeper: [
    {
      label: "He et al. 2015, Deep Residual Learning",
      url: "https://arxiv.org/abs/1512.03385",
      adds: "The paper that introduced residual connections, and why they make very deep networks trainable.",
    },
    {
      label: "Xiong et al. 2020, On Layer Normalization in the Transformer Architecture",
      url: "https://arxiv.org/abs/2002.04745",
      adds: "Why pre-norm transformers train stably without learning-rate warm-up.",
    },
    {
      label: "Sun et al. 2024, Massive Activations in Large Language Models",
      url: "https://arxiv.org/abs/2402.17762",
      adds: "The huge values that appear on a few tokens, like GPT-2's first token, and what they do.",
    },
  ],
};
