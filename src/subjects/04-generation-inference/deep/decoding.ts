import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const decoding: DeepLesson = {
  why: [
    "Step 1 ended with a probability for every token in the vocabulary. The model's job stops there. Choosing one token from that distribution is a separate decision, made by a few lines of code called the **decoding rule**, and it changes the text you get far more than most people expect.",
    "Here's the problem in one example. Ask GPT-2 small to continue \"The cat sat on the\" and always take its single most likely token. Within forty tokens it's stuck: \"I'm sorry. I'm sorry. I'm sorry. I'm sorry.\" Now sample at random from the full distribution instead, and from \"My favourite thing about weekends is\" you get \"travelling when seven festivals have stories...\" at a high temperature. One rule is too safe, the other too wild, and the same model produced both.",
    "In this step you'll meet the three classic ways to choose: **greedy** decoding, **sampling** with a **temperature**, and **beam search**. You'll see each one run on the real GPT-2 recordings, implement them in NumPy, and learn why chat models sample, while translation systems have long used beam search. Step 3 then adds the tail-cutting rules, top-k, top-p and min-p, that make sampling usable.",
  ],
  worked: [
    {
      kind: "text",
      text: "Temperature first. It divides the logits before softmax. Here's what it does to GPT-2's real distribution after \"The cat sat on the\", computed over the full 50,257-token vocabulary:",
    },
    {
      kind: "table",
      caption: "Temperature reshapes GPT-2's distribution after \"The cat sat on the\"",
      columns: ["temperature", "top token's probability", "entropy (bits)", "tokens for 90%"],
      rows: [
        [0.1, 0.7863, 0.99, 2],
        [0.5, 0.2493, 3.458, 9],
        [0.7, 0.1644, 4.856, 36],
        [1, 0.0764, 7.813, 728],
        [1.5, 0.018, 11.667, 7410],
        [2, 0.0055, 13.352, 15483],
      ],
      source: "worked/decoding.py",
    },
    {
      kind: "text",
      text: "Now the outputs. Greedy and beam search are deterministic. The last column is the total log-probability the model gives the whole 40-token continuation; higher (closer to 0) is more likely:",
    },
    {
      kind: "table",
      caption: "Greedy and beam search from \"The cat sat on the\" (40 tokens)",
      columns: ["method", "continuation starts", "log-probability"],
      rows: [
        ["greedy", " floor, and the cat was still asleep.  \"I'm sorry, I'm sorry…", -49.546],
        ["beam search, 5 beams", " edge of the bed, her head resting on the side of the bed.…", -42.648],
      ],
      source: "worked/decoding.py",
    },
    {
      kind: "text",
      text: "Sampling is random, so we fixed the seed. For each temperature we also counted how many of the 30 chosen tokens the model ranked outside its top 100, and the worst rank picked:",
    },
    {
      kind: "table",
      caption: "Sampling from \"My favourite thing about weekends is\" (seed 0, 30 tokens)",
      columns: ["setting", "continuation starts", "tokens outside the top 100", "worst rank picked"],
      rows: [
        ["T=0.3", " that you can enjoy the whole weekend in one place…", 0, 11],
        ["T=0.7", " that when we are playing, we are always at the to…", 2, 333],
        ["T=1.0", " always when we are playing with families is we al…", 4, 10730],
        ["T=1.5", " travelling when seven festivals have stories... i…", 17, 11630],
      ],
      source: "worked/decoding.py",
    },
  ],
  concept: [
    {
      heading: "Greedy: always take the top token",
      paragraphs: [
        "The simplest rule is to take the most likely token every time, argmax over the logits. It's deterministic, cheap and often fine for short, factual answers: \"Your loan application has been\" gives \" approved\" first, at 24%.",
        "Its weakness shows over longer stretches. Each choice only looks one token ahead, and once the text repeats a phrase, the model's own output makes that phrase more likely to come again. GPT-2's greedy continuation of \"The cat sat on the\" falls into \"I'm sorry.\" and never leaves. Holtzman et al. (2020) called this **neural text degeneration**: likelihood-maximising decoding gives text that is bland and repetitive, and it doesn't look like human writing, which is rarely the single most probable choice at each step.",
        "Greedy is still what you get when you set an API's temperature to 0, and it's the right tool when you want the same answer every time: extracting a field from a document, classifying a ticket, or checking a model's behaviour in a test.",
      ],
      lab: { view: "greedy-loop", label: "Greedy loops", task: "Read GPT-2's real greedy continuations. Where does the cat story start repeating, and how much of the text ends up in the loop?" },
    },
    {
      heading: "Temperature: sharpen or flatten, then sample",
      paragraphs: [
        "Instead of always taking the top token, **sample**: pick token i with probability p(i). Most of the time you'll still get a likely token, but sometimes a less likely one, which breaks loops and gives variety. Sampling means drawing a random number u between 0 and 1 and walking down the running total of probabilities until it passes u.",
        "**Temperature** T controls how adventurous the sampling is. Divide every logit by T before softmax. With T < 1 the gaps between logits grow, so the favourites get more of the probability; with T > 1 the gaps shrink and the distribution flattens. As T approaches 0 sampling becomes greedy. At T = 1 you sample from the model's own distribution. The worked example shows the scale of it on real numbers: for \"The cat sat on the\", 90% of the probability needs 9 tokens at T = 0.5, 728 at T = 1 and 15,483 at T = 2.",
        "There's no single correct temperature. Low values (0.2–0.7) suit answers that should stay close to the model's best guess; values near 1 give more varied writing. Push it above 1 and the model starts picking tokens it considers nearly impossible, which is how you get \"seven festivals have stories\".",
      ],
      formula: {
        expr: "p_T(i) = exp(zᵢ / T) / Σⱼ exp(zⱼ / T)",
        symbols: [
          { sym: "zᵢ", meaning: "the logit of token i" },
          { sym: "T", meaning: "temperature: below 1 sharpens, above 1 flattens, near 0 is greedy" },
        ],
        example: "\"The cat sat on the\": the top token \" floor\" has 7.6% at T = 1 and 78.6% at T = 0.1.",
      },
      mistake: "Thinking temperature changes what the model knows or makes it \"more creative\" in a deep sense. It only rescales the logits of one fixed distribution before a token is drawn; the model's ranking of tokens is exactly the same at every temperature.",
      lab: { view: "temperature", label: "Temperature", task: "Slide the temperature on a real GPT-2 distribution. At what temperature does the top token pass 50%, and how many tokens cover 90% at T = 2?" },
    },
    {
      heading: "Sampling is random, and seeds make it repeatable",
      paragraphs: [
        "Because sampling draws random numbers, the same prompt gives different text each time. That's usually what you want from a chat model, but it makes testing hard. The fix is a **seed**: start the random-number generator from a fixed value and the same draws, and so the same text, come out again. All the samples in this lesson were recorded with seeds 0, 1 and 2, and rerunning them gives the same words.",
        "The samples show what temperature does over a whole continuation. At T = 0.3 every one of the 30 tokens was in the model's top 11. At T = 1, sampling from the model's own distribution, 4 of the 30 came from outside the top 100, one of them ranked 10,730th, and the text drifts into \"we all have bipartisan support on that\". At T = 1.5, 17 of 30 came from outside the top 100. The problem isn't that rare tokens exist; it's that there are tens of thousands of them, and their small probabilities add up.",
        "Notice something about the seeds: at T = 1, seed 0 starts \"always when we are playing with families\", and so does the top-k sample with seed 0 in step 3's lab. Same random numbers, same early choices; they part ways only when a draw lands in the tail that top-k cuts off.",
      ],
      lab: { view: "temp-samples", label: "Seeded samples", task: "Compare the three seeds at each temperature. At which temperature do tokens from outside the top 100 start to appear, and what do they do to the text?" },
    },
    {
      heading: "Beam search: look further than one token",
      paragraphs: [
        "Greedy can miss the best sentence because the best first token isn't always the start of the best sequence. **Beam search** keeps the k most likely partial sequences (the beams) at each step instead of one. It extends each by every possible next token, scores all of them by total log-probability, and keeps the top k again. With k = 1 it's greedy.",
        "On the real model it works as advertised. With 5 beams, GPT-2's continuation of \"The cat sat on the\" has a log-probability of −42.6, against greedy's −49.5: about e^6.9, roughly 1,000 times, more likely as a whole. It also avoided the \"I'm sorry\" loop this time, though beam search is known to produce repetition and dull text too, for the same reason as greedy: it looks for the most likely sequence, and that isn't what good writing is.",
        "So beam search is used where there's one right answer and likelihood tracks quality, like machine translation and speech recognition, and less in open-ended chat. It also costs k times the compute and k times the KV cache (step 5). In the Build it exercise you'll write it and watch it beat greedy on a small made-up table.",
      ],
      lab: { view: "beam", label: "Beam search", task: "Compare greedy and beam search on GPT-2, then run the toy beam search with 1, 2 and 3 beams. When does keeping a second beam change the answer?" },
    },
  ],
  guided:
    "Before opening **Temperature**, predict how many tokens GPT-2 needs to cover 90% of its probability after \"The cat sat on the\" at T = 0.5 and at T = 2. Then use **Seeded samples** to find the lowest temperature at which a token from outside the top 100 gets picked.",
  build: {
    id: "m04-decoding",
    title: "Implement temperature, sampling and beam search",
    packages: ["numpy"],
    data: "m04",
    parts: [
      part("decoding", "p1", "Write a temperature softmax and greedy decoding, checked on GPT-2's real logits.", [
        "Divide the logits by T first, then subtract the max and exponentiate.",
        "Greedy is `int(np.argmax(z))`.",
      ]),
      part("decoding", "p2", "Draw a token by inverse-CDF sampling with a seeded random generator, and check the frequencies.", [
        "`u = rng.random()`, then the first index where the cumulative sum passes u.",
        "`np.searchsorted(np.cumsum(p), u, side=\"right\")` does exactly that.",
      ]),
      part("decoding", "p3", "Write beam search and show that two beams find a more likely sequence than greedy.", [
        "For every (seq, score) beam and every (token, logprob) next, make (seq + [token], score + logprob).",
        "Sort the new list by score, highest first, and keep `width` of them.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m04-decoding-temp",
      prompt: "What does lowering the temperature from 1 to 0.3 do?",
      options: [
        "Makes the model rank tokens differently",
        "Widens the gaps between logits, so likely tokens get more probability and sampling stays closer to greedy",
        "Removes all but the top 30% of tokens",
        "Makes generation faster",
      ],
      correctIndex: 1,
      explanation: "The logits are divided by T before softmax. The ranking never changes; only how peaked the distribution is.",
    },
    {
      id: "m04-decoding-greedy",
      prompt: "Why does greedy decoding often get stuck repeating a phrase?",
      options: [
        "Because it's random",
        "Because it always takes the single most likely token, and a phrase it has just written becomes more likely to come again",
        "Because the KV cache stores the phrase",
        "Because the vocabulary is too small",
      ],
      correctIndex: 1,
      explanation: "Holtzman et al. (2020): likelihood-maximising decoding produces repetitive, degenerate text. GPT-2's greedy continuation loops on \"I'm sorry.\"",
    },
    {
      id: "m04-decoding-beam",
      prompt: "Beam search with 1 beam is the same as…",
      options: ["Sampling at temperature 1", "Greedy decoding", "Top-k with k = 1 at temperature 2", "No decoding at all"],
      correctIndex: 1,
      explanation: "Keeping only the best partial sequence at every step is exactly greedy decoding.",
    },
  ],
  oneSentence:
    "Greedy decoding takes the top token and tends to loop, sampling draws from the distribution after temperature rescales the logits (below 1 sharpens, above 1 flattens, with a seed for repeatability), and beam search keeps several partial sequences to find a more likely whole, useful when there's one right answer.",
  deeper: [
    {
      label: "Holtzman et al. 2020, The Curious Case of Neural Text Degeneration",
      url: "https://arxiv.org/abs/1904.09751",
      adds: "Why greedy and beam search produce repetitive text, and why pure sampling wanders.",
    },
    {
      label: "Hugging Face, Generation strategies",
      url: "https://huggingface.co/docs/transformers/generation_strategies",
      adds: "Greedy, sampling and beam search with generate(), and the parameters that control them.",
    },
    {
      label: "Wikipedia, Softmax function",
      url: "https://en.wikipedia.org/wiki/Softmax_function",
      adds: "Softmax with a temperature, and where the idea comes from: the Boltzmann distribution in statistical physics.",
    },
  ],
};
