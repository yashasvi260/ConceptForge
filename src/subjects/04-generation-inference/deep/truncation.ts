import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const truncation: DeepLesson = {
  why: [
    "Step 2 left you with a dilemma. Greedy decoding is safe but loops. Sampling at temperature 1 is varied, but every so often it picks a token the model itself thought was absurd: one GPT-2 sample took a token ranked 10,730th and wandered off into \"we all have bipartisan support on that\". Lowering the temperature helps, but it also squeezes the good alternatives you wanted variety from.",
    "The real culprit is the **tail**. Each token in the tail is individually unlikely, but there are tens of thousands of them, and together they hold a surprising amount of probability. After \"The capital of France is\", GPT-2 small leaves 37.6% of its probability outside its top 100 tokens. Sample 30 tokens and you should expect several to come from out there.",
    "So practical decoders cut the tail off before sampling. **Top-k** keeps a fixed number of tokens, **top-p** (nucleus sampling) keeps a fixed share of the probability, and **min-p** keeps tokens within a fraction of the favourite. In this step you'll measure the tail on real GPT-2 distributions, see why a fixed k can't fit every prompt, and build the full sampling chain, in the same order Hugging Face runs it. Ollama's own documented defaults are temperature 0.8, top-k 40 and top-p 0.9, so you've used this chain many times already.",
  ],
  worked: [
    {
      kind: "text",
      text: "How heavy is the tail? Here's the share of GPT-2's probability left outside its top 10, top 100 and top 1,000 tokens, over the full vocabulary:",
    },
    {
      kind: "table",
      caption: "Probability GPT-2 leaves outside its top k tokens",
      columns: ["prompt", "outside top 10", "outside top 100", "outside top 1,000"],
      rows: [
        ["The capital of France is", 0.64095, 0.37618, 0.1347],
        ["The cat sat on the", 0.57353, 0.28118, 0.07909],
        ["Your loan application has been", 0.38372, 0.12831, 0.01348],
        ["My favourite thing about weekends is", 0.34426, 0.08624, 0.02124],
      ],
      source: "worked/truncation.py",
    },
    {
      kind: "text",
      text: "Now the three rules with typical settings. Top-k 40 keeps 40 tokens on every prompt, so the column shows how much probability those 40 hold. Top-p 0.9 and min-p 0.1 instead keep a varying number of tokens:",
    },
    {
      kind: "table",
      caption: "What each rule keeps on four prompts",
      columns: ["prompt", "share held by top-k 40", "tokens kept by top-p 0.9", "tokens kept by min-p 0.1"],
      rows: [
        ["The capital of France is", 0.526, 1503, 16],
        ["The cat sat on the", 0.617, 728, 17],
        ["Your loan application has been", 0.788, 138, 6],
        ["My favourite thing about weekends is", 0.859, 77, 6],
      ],
      source: "worked/truncation.py",
    },
    {
      kind: "text",
      text: "Finally, the effect on real text. Three seeds, 30 tokens each, all at temperature 1; the last column is the average log-probability of a 30-token sample:",
    },
    {
      kind: "table",
      caption: "Three seeds × 30 tokens from \"My favourite thing about weekends is\", T = 1",
      columns: ["setting", "tokens outside the top 100", "worst rank picked", "average log-probability"],
      rows: [
        ["T=1.0", 15, 10730, -128.8],
        ["T=1.0, top-k 40", 0, 36, -78.9],
        ["T=1.0, top-p 0.9", 4, 612, -82.3],
      ],
      source: "worked/truncation.py",
    },
  ],
  concept: [
    {
      heading: "The tail: unlikely one by one, likely together",
      paragraphs: [
        "A language model gives some probability to every token in its vocabulary, because during training a hard zero would be punished infinitely whenever that token did turn up. So the model hedges, spreading small amounts over everything. Each of those amounts is tiny, but a vocabulary has 50,000 to 200,000 entries, and tiny times tens of thousands isn't tiny.",
        "The first worked table measures it. After \"The capital of France is\", 13.5% of GPT-2's probability sits on tokens ranked below 1,000th, roughly one draw in seven. Those tokens aren't wrong in any careful sense; many are rare spellings, other languages or fragments. But once one is sampled, it's in the text for good, and every later token is conditioned on it. That's how pure sampling drifts: one odd choice and the model carries on as if it were intended.",
        "The fix is called **truncation**: before sampling, set the probability of the unreliable tail to zero and renormalise what's left. All the rules below differ only in where they draw the line.",
      ],
      lab: { view: "tail-mass", label: "The tail", task: "Move the cut-off and watch how much probability lies beyond it on each prompt. How many tokens do you need to keep before the tail holds less than 5%?" },
    },
    {
      heading: "Top-k: keep a fixed number",
      paragraphs: [
        "**Top-k** keeps the k most likely tokens and drops the rest. Fan et al. (2018) used k = 10 for story generation, and k = 40 is a common default (it's Ollama's). It's simple and it works: on the real weekend samples, top-k 40 brought the worst rank picked from 10,730 down to 36, and the text stays grammatical.",
        "Its flaw is that k ignores the shape of the distribution. When the model is confident, 40 tokens include plenty of nonsense: after \"Your loan application has been\", the top 40 already hold 78.8%, and the 40th is far down. When the model is genuinely uncertain, 40 is too few: after \"The capital of France is\", the top 40 hold only 52.6%, so top-k throws away nearly half the model's probability, much of it reasonable. A fixed number can't be right for both.",
      ],
      lab: { view: "topk-fixed", label: "Top-k", task: "Pick a k and compare how much probability it keeps on the four prompts. Is there one k that keeps 80% everywhere?" },
    },
    {
      heading: "Top-p: keep a fixed share",
      paragraphs: [
        "**Top-p**, or **nucleus sampling** (Holtzman et al. 2020), turns the question around. Sort the tokens from most to least likely and keep adding them until their probabilities sum to at least p; that set is the nucleus, and everything outside it is dropped. With p = 0.9 you always keep 90% of the probability, however many tokens that takes.",
        "So the nucleus adapts. On the real prompts, top-p 0.9 keeps 77 tokens for the confident weekend prompt and 1,503 for the uncertain France one. Holtzman et al. found nucleus sampling gave text closer to human writing in diversity and quality than greedy, beam, pure sampling or top-k.",
        "It isn't perfect. On a very flat distribution, 90% of the probability can still include a long, weak tail: in the real samples, top-p 0.9 still picked one token ranked 612th. That's why APIs let you combine rules, and why top-p is often set to 0.9–0.95 alongside a temperature below 1.",
      ],
      formula: {
        expr: "nucleus = smallest set V_p with Σ_{i ∈ V_p} p(i) ≥ p",
        symbols: [
          { sym: "p", meaning: "the share of probability to keep, e.g. 0.9" },
          { sym: "V_p", meaning: "the most likely tokens, added in order until their total reaches p" },
        ],
        example: "\"My favourite thing about weekends is\": the 0.5 nucleus is 4 tokens (27.4% + 13.4% + 5.3% + 4.6% = 50.7%).",
      },
      lab: { view: "nucleus", label: "Top-p", task: "Change p and compare the nucleus size on the four prompts. Which prompt's nucleus grows fastest as p approaches 0.99?" },
    },
    {
      heading: "Min-p, penalties and the order of the chain",
      paragraphs: [
        "**Min-p** (Nguyen et al. 2024) uses the favourite as the yardstick: keep every token whose probability is at least min_p times the top token's. With min_p = 0.1, a token needs a tenth of the favourite's probability. When the model is confident, that cuts hard; when it's unsure, more survives. On the real prompts min-p 0.1 keeps 6 to 17 tokens. Ollama's documentation gives the same rule: with min_p 0.05 and a favourite at 0.9, tokens below 0.045 are filtered out.",
        "In practice these rules run as a **chain**, each on what the previous one left, renormalising as it goes. The order matters. In Hugging Face's generate() (we checked transformers 5.22.2's source), the processors run as: repetition penalty, then temperature, then top-k, then top-p, then min-p, and finally one token is drawn. Temperature coming first means truncation sees the reshaped distribution, so a high temperature makes top-p keep more tokens. Other libraries use different orders, so the same numbers don't always mean the same thing across tools.",
        "The repetition penalty at the front of that chain is a different kind of rule: it lowers the logits of tokens already in the text, so the model is less likely to repeat itself. Step 4 tries it on GPT-2's greedy loop.",
      ],
      mistake: "Setting top-p and top-k and assuming they act independently on the original probabilities. They run in sequence: top-p is computed on what top-k left (renormalised), and both see the distribution after temperature, so changing the temperature changes how many tokens top-p keeps.",
      lab: { view: "sampler-chain", label: "The sampling chain", task: "Set a temperature, top-k, top-p and min-p, and watch each stage cut GPT-2's real top 40. Raise the temperature: does top-p keep more tokens or fewer?" },
    },
  ],
  guided:
    "Before opening **Top-k**, predict which prompt loses the most probability when only 40 tokens are kept. Then use **The sampling chain** to find settings that keep between 5 and 15 tokens on both \"The capital of France is\" and \"Your loan application has been\".",
  build: {
    id: "m04-truncation",
    title: "Build top-k, top-p, min-p and the sampling chain",
    packages: ["numpy"],
    data: "m04",
    parts: [
      part("truncation", "p1", "Keep only the k largest logits, so softmax gives every other token probability 0.", [
        "Start from `np.full_like(z, -np.inf)` and copy back the k largest.",
        "`np.argsort(-z)[:k]` gives the indices of the k largest logits.",
      ]),
      part("truncation", "p2", "Find the nucleus: the smallest set of most likely tokens holding at least p, checked against GPT-2's real nucleus sizes.", [
        "Sort with `np.argsort(-p)`, then take the running total with `np.cumsum`.",
        "Keep tokens up to and including the first one where the total reaches p.",
      ]),
      part("truncation", "p3", "Write min-p, then chain everything in Hugging Face's order: temperature, top-k, top-p, min-p, draw.", [
        "min-p keeps `p >= min_p * p.max()`.",
        "Renormalise after each cut: `p = np.where(mask, p, 0); p /= p.sum()`.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m04-truncation-topk",
      prompt: "Why can a fixed top-k be too strict for one prompt and too loose for another?",
      options: [
        "Because k changes with the temperature",
        "Because k ignores the distribution's shape: 40 tokens hold 53% of GPT-2's probability after one prompt and 86% after another",
        "Because top-k only works with greedy decoding",
        "Because k must equal the vocabulary size",
      ],
      correctIndex: 1,
      explanation: "A confident distribution needs few tokens and an uncertain one many; top-p and min-p adapt, top-k doesn't.",
    },
    {
      id: "m04-truncation-topp",
      prompt: "With top-p = 0.9, GPT-2 keeps 77 tokens after one prompt and 1,503 after another. Why?",
      options: [
        "Top-p keeps the 90 most likely tokens",
        "The nucleus is the smallest set holding 90% of the probability, and how many tokens that takes depends on how spread out the distribution is",
        "It's random",
        "The vocabulary is different for each prompt",
      ],
      correctIndex: 1,
      explanation: "Nucleus sampling (Holtzman et al. 2020) fixes the share of probability kept, not the number of tokens.",
    },
    {
      id: "m04-truncation-order",
      prompt: "In Hugging Face's generate(), what happens first: temperature or top-p?",
      options: [
        "Top-p, then temperature",
        "Temperature, then top-k, then top-p, then min-p, each on what the previous one left",
        "They're applied independently to the original probabilities",
        "Only one of them can be used at a time",
      ],
      correctIndex: 1,
      explanation: "So a higher temperature flattens the distribution before top-p measures it, and top-p keeps more tokens.",
    },
  ],
  oneSentence:
    "Thousands of individually unlikely tokens together hold a lot of probability, so decoders truncate before sampling: top-k keeps a fixed number, top-p keeps the smallest set holding a share p, min-p keeps tokens within a fraction of the favourite, and they run as a chain after temperature, in an order that changes the result.",
  deeper: [
    {
      label: "Holtzman et al. 2020, The Curious Case of Neural Text Degeneration",
      url: "https://arxiv.org/abs/1904.09751",
      adds: "Nucleus (top-p) sampling, the unreliable tail and comparisons with top-k.",
    },
    {
      label: "Nguyen et al. 2024, Turning Up the Heat: Min-p Sampling for Creative and Coherent LLM Outputs",
      url: "https://arxiv.org/abs/2407.01082",
      adds: "Min-p sampling and how it behaves at high temperatures.",
    },
    {
      label: "Ollama Modelfile parameters",
      url: "https://github.com/ollama/ollama/blob/main/docs/modelfile.mdx",
      adds: "The sampling options a local model accepts (temperature, top_k, top_p, min_p, repeat_penalty) and their defaults.",
    },
  ],
};
