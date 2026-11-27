import type { DeepLesson } from "../../../core/types";
import { localListing, part } from "./files";

export const recap: DeepLesson = {
  why: [
    "You've now followed generation from end to end: a final vector becomes 50,257 logits, softmax turns them into probabilities, temperature and the truncation rules reshape them, one token is drawn, and the loop appends it and runs again, reusing every past key and value from the cache. Each piece made sense on its own. This step's mini-project puts them together, the way an inference engine does.",
    "You'll write a complete sampler, one function that applies temperature, top-k, top-p and min-p in Hugging Face's order, and check it reproduces what the lab showed for GPT-2's real logits: at Ollama's default settings, 18 of the top 40 tokens survive after \"The capital of France is\". Then you'll write the generation loop with a KV cache, on a small made-up model, and prove it gives exactly the same tokens as the loop without one, while feeding far fewer tokens.",
    "The \"Run it locally\" listing closes the loop on real weights. It runs GPT-2 small through the same NumPy code you wrote in Module 03, now with a cache, and checks the 20 tokens it writes against Hugging Face's generate(): identical, with 24 tokens fed instead of 290. After this, an inference server holds no mysteries; it runs this loop, very fast, for many users at once.",
  ],
  worked: [
    {
      kind: "text",
      text: "One real generation step, from GPT-2's final vector to a token, with Ollama's default sampling settings (temperature 0.8, top-k 40, top-p 0.9):",
    },
    {
      kind: "table",
      caption: "One real step: \"The capital of France is\" with Ollama's defaults",
      columns: ["stage", "result"],
      rows: [
        ["the final vector h", "768 numbers, length 255.4"],
        ["logits: h · every row of the tied output matrix", "50,257 scores; top ' the' at -100.25"],
        ["softmax at temperature 0.8, whole vocabulary", "' the' 16.7%"],
        ["top-k 40", "40 tokens holding 77.1%, renormalised"],
        ["top-p 0.9 on what's left", "18 tokens"],
        ["draw one token", "' the' with probability 24.0%"],
      ],
      source: "worked/recap.py",
    },
    {
      kind: "text",
      text: "And the module in seven measurements, each from a step you can revisit:",
    },
    {
      kind: "table",
      caption: "Module 04 in seven measurements (GPT-2 small)",
      columns: ["measurement", "value"],
      rows: [
        ["GPT-2's perplexity on the bank sentence (step 1)", "68.3"],
        ["worst rank picked in 90 tokens: pure sampling at T = 1 vs top-k 40 (steps 2–3)", "10,730 vs 36"],
        ["tokens covering 90%: weekends vs France (step 3)", "77 vs 1,503"],
        ["prefill per prompt token vs one decode step, ms (step 4)", "0.86 vs 25.66"],
        ["tokens fed in a 20-step loop: cache vs none (step 5)", "24 vs 290"],
        ["largest logit difference, cache vs none (step 5)", "0.000671"],
        ["loss with 2–4 vs 257–1,023 tokens of context (step 6)", "5.181 vs 3.48"],
      ],
      source: "worked/recap.py",
    },
  ],
  concept: [
    {
      heading: "One step, from vector to token",
      paragraphs: [
        "Put steps 1 to 3 in a line and a single generation step has six stages. Take the final vector at the last position. Dot it with every row of the output matrix to get logits. Divide by the temperature. Keep the top k. Softmax, then keep the top-p nucleus and anything above min-p. Draw one token from what's left.",
        "The worked table runs that line on real numbers. GPT-2's favourite after \"The capital of France is\" starts at 8.5% at temperature 1, rises to 16.7% at 0.8, and after the top-40 and top-p cuts it's drawn 24.0% of the time; 18 tokens remain possible. Each stage changed the odds, and none of them changed the model. That's worth remembering when a model \"behaves differently\" in two tools: check the sampling settings before blaming the weights.",
      ],
      lab: { view: "step-trace", label: "One step", task: "Follow a real step through all six stages, then draw tokens. How often does ' Paris' come out, and what would you change to make it more likely?" },
    },
    {
      heading: "The sampler is a pipeline",
      paragraphs: [
        "In code the whole decoding rule is one short function: logits in, token id out. Temperature 0 short-circuits to argmax (greedy). Otherwise the logits are scaled, cut and renormalised in a fixed order, and a random number picks the token. Hugging Face implements each stage as a separate logits processor in a list, which is why you can add your own, for example to forbid certain tokens or force valid JSON. Ollama exposes the same stages as options.",
        "The same mechanism gives you structured output. A constrained-decoding processor looks at the text so far and, before the draw, sets the logit of every token that would break a grammar, say a JSON schema, to −∞. The model can then only produce valid JSON, however it would have liked to continue. Ollama's format option with a JSON schema works this way, and Module 08 uses it to extract fields reliably.",
        "Because the pipeline is deterministic apart from the random draw, a seeded random generator makes the whole thing reproducible: in the Build it exercise, the same seed gives the same tokens every time. In production that guarantee is weaker than it looks, because tiny numerical differences can flip a close call, as the mistake below explains.",
      ],
      mistake: "Expecting a seed to make outputs identical everywhere. A seed repeats the same random draws, but a different GPU, library version or batch of other requests can change the logits in the last decimal places, and when two tokens are nearly tied that's enough to pick a different one; from then on the texts diverge.",
      lab: { view: "sampler-chain", label: "The pipeline", task: "Set Ollama's defaults (T 0.8, top-k 40, top-p 0.9) on each prompt. How many tokens survive on the confident prompts compared with the uncertain ones?" },
    },
    {
      heading: "The loop and its cache",
      paragraphs: [
        "Wrap the sampler in step 4's loop and add step 5's cache, and you have a complete generator. The first step feeds the whole prompt and fills the cache; every later step feeds only the newest token at its correct position, appends its key and value to every layer's cache, and samples again. Without the cache, each step feeds everything into a fresh cache instead.",
        "The test of a correct cache is simple: both loops must produce the same tokens, greedy or seeded. The lab runs a small made-up model both ways, live in your browser. The listing does the same with GPT-2's real weights and also compares with Hugging Face: same 20 tokens, 24 tokens fed instead of 290. Get the position wrong when feeding the newest token, or forget to append its own key and value before attending, and the outputs drift apart within a few steps, which makes the check a good one.",
      ],
      lab: { view: "cache-twin", label: "Cache twin", task: "Run the made-up model with and without the cache. Do the tokens match? Now break the cache on purpose and see how quickly they diverge." },
    },
    {
      heading: "Every setting you've met",
      paragraphs: [
        "Most of what you can configure when calling a model maps to one of this module's steps. Temperature, top-k, top-p and min-p are the sampling pipeline (steps 2 and 3). The token limit, stop sequences and repetition penalty belong to the loop (step 4). The seed makes sampling repeatable (step 2). The context size sets how many keys and values the cache may hold (steps 5 and 6), which is why raising it costs memory even before you use it.",
        "Defaults differ by tool and by model. Ollama documents temperature 0.8, top-k 40 and top-p 0.9; a model's own configuration can override them, and hosted APIs choose their own. When results matter, set the values explicitly, and for tasks with one right answer, like extracting a field from a document, use temperature 0.",
        "That's the whole path from a vector to the next token. Module 05 goes back to where the model's weights came from, training, and Part II then puts these models to work, starting with classifying text.",
      ],
      lab: { view: "settings-map", label: "Settings map", task: "Click through the settings. Which ones change the distribution, which change the loop, and which only matter when sampling (not greedy)?" },
    },
  ],
  guided:
    "Before opening **One step**, predict what share of draws will be ' the' at Ollama's default settings. Then use **Cache twin** to break the cache and count how many steps it takes for the outputs to diverge.",
  build: {
    id: "m04-recap",
    title: "Mini-project: a complete sampler and a cached generation loop",
    packages: ["numpy"],
    data: "m04",
    parts: [
      part("recap", "p1", "Compute the final sampling distribution in Hugging Face's order and reproduce the lab's 18 surviving tokens on GPT-2's real logits.", [
        "Divide by the temperature first, then mark the top k with `np.argsort(-z)`.",
        "After each cut: zero the dropped tokens and divide by the new sum.",
      ]),
      part("recap", "p2", "Turn it into a sampler: temperature 0 is greedy, otherwise draw from the final distribution with a seeded generator.", [
        "`if temperature == 0: return int(np.argmax(z))`.",
        "Draw with `np.searchsorted(np.cumsum(p), rng.random(), side=\"right\")`.",
      ]),
      part("recap", "p3", "Write the generation loop with and without a KV cache on a made-up model, and prove they give the same tokens.", [
        "With the cache, step 0 feeds the prompt at position 0; later steps feed `ids[-1:]` at position `len(ids) - 1`.",
        "Without it, every step feeds `ids` at position 0 into a fresh `{\"K\": [], \"V\": []}`.",
      ]),
    ],
  },
  local: [localListing("gpt2-generate", "Greedy generation with a KV cache in NumPy, with GPT-2's real weights", ["torch", "transformers"])],
  checks: [
    {
      id: "m04-recap-order",
      prompt: "Put one generation step in order.",
      options: [
        "Sample, softmax, logits, temperature",
        "Final vector → logits → divide by temperature → top-k → softmax → top-p / min-p → draw → append (and cache K, V)",
        "Top-p → logits → temperature → draw",
        "Logits → draw → softmax → temperature",
      ],
      correctIndex: 1,
      explanation: "That's Hugging Face's order; each stage reshapes the same distribution, and none changes the model.",
    },
    {
      id: "m04-recap-cache-check",
      prompt: "How do you know a KV-cache implementation is correct?",
      options: [
        "It's faster",
        "It produces exactly the same tokens (greedy, or sampled with the same seed) as the loop without a cache",
        "It uses less memory",
        "The cache has one entry per layer",
      ],
      correctIndex: 1,
      explanation: "Caching rearranges the work but computes the same thing; any difference beyond rounding means a bug, often a wrong position or a missing key.",
    },
    {
      id: "m04-recap-extract",
      prompt: "You're extracting a date from a scanned contract and want the same answer every run. Which settings?",
      options: ["Temperature 1.5, top-p 0.99", "Temperature 0 (greedy); top-k and top-p then don't matter", "Top-k 1000", "A high repetition penalty"],
      correctIndex: 1,
      explanation: "With one right answer, greedy is the natural choice, and it ignores the truncation settings.",
    },
  ],
  oneSentence:
    "Generation is a sampler inside a loop: the final vector becomes logits, temperature, top-k, top-p and min-p reshape them in a fixed order before one token is drawn (or argmax at temperature 0), and the loop appends it and repeats, feeding only the newest token because the KV cache keeps every past key and value, which gives exactly the same tokens as recomputing everything.",
  deeper: [
    {
      label: "Hugging Face, Logits processors (transformers source)",
      url: "https://github.com/huggingface/transformers/blob/main/src/transformers/generation/logits_process.py",
      adds: "The real implementations of temperature, top-k, top-p, min-p and the repetition penalty.",
    },
    {
      label: "Hugging Face, Generation strategies",
      url: "https://huggingface.co/docs/transformers/generation_strategies",
      adds: "Every decoding option generate() offers, with examples.",
    },
    {
      label: "Ollama API: options",
      url: "https://github.com/ollama/ollama/blob/main/docs/api.md",
      adds: "The same settings as request options for a local model.",
    },
  ],
};
