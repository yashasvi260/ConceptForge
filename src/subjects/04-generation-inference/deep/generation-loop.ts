import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const generationLoop: DeepLesson = {
  why: [
    "Steps 1 to 3 produced one token. A reply is hundreds of them, and the only way a decoder-only model writes them is one at a time: predict a token, append it to the input, and run the whole model again. Everything you notice about using a language model, the text appearing word by word, the pause before the first word, a reply that stops mid-sentence or never stops, comes from this loop and the rules around it.",
    "The loop also explains costs that look strange at first. Reading a 512-token prompt took GPT-2 small 439 milliseconds on our test CPU, under 1 ms per token. Writing each new token took 26 ms, about 30 times longer per token. That's why hosted APIs usually charge several times more for output tokens than input tokens, and why a long answer is slow even when the question was short.",
    "In this step you'll follow GPT-2's real loop step by step, write the loop yourself with its two stopping rules, add stop sequences, and meet the logit processors that look back at what the loop has already written, the repetition penalties. Step 5 then makes the loop fast with the KV cache.",
  ],
  worked: [
    {
      kind: "text",
      text: "Here's GPT-2's real loop on \"Your loan application has been\", greedy. The first step reads the whole 5-token prompt; after that, thanks to the KV cache (step 5), each step feeds only the newest token, while the context the model attends to keeps growing:",
    },
    {
      kind: "table",
      caption: "The loop, step by step (\"Your loan application has been\", greedy)",
      columns: ["step", "tokens fed", "context length", "chosen token", "its probability"],
      rows: [
        [1, 5, 5, "' approved'", 0.2425],
        [2, 1, 6, "'.'", 0.2856],
        [3, 1, 7, "'\\n'", 0.2853],
        [4, 1, 8, "'\\n'", 0.9995],
        [5, 1, 9, "'If'", 0.0664],
        [6, 1, 10, "' you'", 0.6615],
        [7, 1, 11, "' are'", 0.2287],
        [8, 1, 12, "' not'", 0.086],
      ],
      source: "worked/generation-loop.py",
    },
    {
      kind: "text",
      text: "Now timing, measured on a CPU with 4 threads (your machine will differ, the shape won't). Reading a prompt happens in one parallel pass, so it costs under a millisecond per token until the prompt gets long; generating costs a full pass per token:",
    },
    {
      kind: "table",
      caption: "Prefill time against prompt length (GPT-2 small, CPU, 4 threads)",
      columns: ["prompt tokens", "milliseconds", "ms per token"],
      rows: [
        [64, 63.4, 0.99],
        [128, 104.2, 0.81],
        [256, 205, 0.8],
        [512, 439.4, 0.86],
        [1024, 1329.6, 1.3],
        ["1 (one decode step, 512 tokens of context)", 25.66, 25.66],
      ],
      source: "worked/generation-loop.py",
    },
    {
      kind: "text",
      text: "Finally, rules that look back at the loop's own output. We reran GPT-2's greedy \"The cat sat on the\" with two of Hugging Face's options. The third column counts tokens inside a repeated 4-token phrase:",
    },
    {
      kind: "table",
      caption: "Penalties on GPT-2's greedy loop (\"The cat sat on the\", 40 tokens)",
      columns: ["setting", "how the text ends", "repeated tokens", "log-probability"],
      rows: [
        ["none", "…\"I'm sorry. I'm sorry. I'm sorry. I'm sorry.", 11, -49.546],
        ["repetition_penalty 1.2", "…to be able for me to do this,\" I told him as we", 0, -93.693],
        ["no_repeat_ngram_size 3", "…not going to let you go.\"  The cat was taken to", 0, -60.387],
      ],
      source: "worked/generation-loop.py",
    },
  ],
  concept: [
    {
      heading: "Score, pick, append, repeat",
      paragraphs: [
        "The loop has four lines. Run the model on the tokens so far and take the logits at the last position (step 1). Turn them into one token with a decoding rule (steps 2 and 3). Append that token to the sequence. Repeat. The model never plans a sentence; each token is chosen knowing only what came before, including everything the model itself just wrote.",
        "That last point matters more than it seems. Once a token is appended, the model treats it as given, whether it was a good choice or a lucky draw from the tail. GPT-2's greedy loan reply is a good example: it confidently continues \"you can contact your lender by calling 1-800-843-5200\", a phone number it invented one plausible token at a time. Nothing in the loop checks facts; it only extends text.",
        "In the worked table, notice step 4: after \".\\n\", the second newline gets 99.95%. Some steps are nearly forced and others, like step 5's \"If\" at 6.6%, are genuine choices. The decoding rule only matters at the second kind, but the loop pays the same full model pass for both.",
      ],
      lab: { view: "loop-steps", label: "The loop", task: "Step through GPT-2's real loop. At which steps was the choice nearly forced, and at which was it a close call?" },
    },
    {
      heading: "When to stop",
      paragraphs: [
        "A loop needs an exit, and there are three. The model can say it's done by producing an **end-of-sequence token**: GPT-2's is <|endoftext|> (id 50256), and chat models end each reply with an end-of-turn token from their chat template (Module 02). The caller can set a **maximum number of new tokens** (max_new_tokens in Hugging Face, num_predict in Ollama, where the default of −1 means no limit). Or the caller can pass **stop sequences**, strings that end the reply as soon as they appear in the text.",
        "Stop sequences are checked on the decoded text, not on token ids, because one string can be split across several tokens: \"1-800\" is three tokens for GPT-2. APIs cut the reply just before the stop sequence and don't return it. That makes them handy for structured output: stop at \"\\n\\n\" for a one-paragraph answer, or at the next \"Question:\" when the prompt is a list of question-answer pairs.",
        "If a reply ends mid-sentence, check which rule fired. A finish reason of \"length\" means max_new_tokens ran out, not that the model was done.",
      ],
      lab: { view: "stop-rules", label: "Stopping rules", task: "Set max_new_tokens and a stop sequence on GPT-2's real greedy text. Which rule fires first, and what does the caller receive?" },
    },
    {
      heading: "Prefill and decode: two very different costs",
      paragraphs: [
        "Generation has two phases. In **prefill**, the model reads the whole prompt in one forward pass. All positions are processed at once, as in training, so the hardware works on big matrix products and stays busy. In **decode**, each step processes a single new token, so most of the time goes into reading the model's weights (and the cache) from memory rather than doing arithmetic.",
        "The real timings show it. A 512-token prompt took 439 ms, 0.86 ms per token. One decode step took 26 ms. Two numbers describe what a user feels: **time to first token** (mostly prefill) and **time per output token** (decode). A 512-token prompt with a 100-token answer on this CPU takes about 0.4 s before anything appears and about 2.6 s more to finish. That's why chat interfaces **stream**, sending each token as it's produced: the answer starts arriving after the prefill instead of after the whole loop.",
        "Notice the last prefill rows: 1,024 tokens took 3 times as long as 512, not twice. Attention compares every token with every earlier one, so its cost grows with the square of the length. Step 6 is about exactly that.",
      ],
      mistake: "Estimating response time from the prompt length. Output tokens dominate: on our measurements a decode step costs about 30 prompt tokens' worth of prefill, so a short question with a long answer is slow, and a long document with a one-word answer is fast.",
      lab: { view: "prefill-decode", label: "Prefill vs decode", task: "Pick a prompt length and an answer length. How long until the first token, and what share of the total time is the answer?" },
    },
    {
      heading: "Rules that look back: repetition penalties",
      paragraphs: [
        "Because the loop feeds its own output back in, repetition can feed on itself, as GPT-2's \"I'm sorry\" loop shows. Two common fixes act on the logits before decoding. The **repetition penalty** (from Keskar et al.'s CTRL paper, 2019) makes every token that already appears in the sequence less likely. Hugging Face divides a positive logit by the penalty and multiplies a negative one by it, applies it at most once per token, and by default counts the prompt as well as the reply.",
        "It's blunt. With a penalty of 1.2, GPT-2's cat story no longer loops, but common words like \"to\" are now penalised too, and the text bends: \"You're not going to be able for me to do this\". The whole continuation's log-probability falls from −49.5 to −93.7. A sharper tool is **no_repeat_ngram_size**: ban any token that would complete a phrase of n tokens already written. With n = 3, GPT-2 breaks out of the loop (\"I'm not going to let you go\") at a much smaller cost in likelihood, −60.4.",
        "Both are blunt in their own way: a no-repeat rule of 3 would also forbid a story from mentioning \"the cat was\" twice. Modern chat models trained on conversations repeat themselves far less, so these penalties are usually left at their defaults (1.0, off, in Ollama) unless a model is visibly looping.",
      ],
      lab: { view: "repetition", label: "Repetition penalties", task: "Compare GPT-2's greedy text with no penalty, a repetition penalty and a no-repeat rule. Which one fixes the loop with the least damage to the text?" },
    },
  ],
  guided:
    "Before opening **Prefill vs decode**, predict which takes longer on our CPU: reading a 512-token prompt, or writing a 20-token answer. Then use **Stopping rules** to make GPT-2's loan reply end after its first sentence.",
  build: {
    id: "m04-generation-loop",
    title: "Write the generation loop, stop sequences and a repetition penalty",
    packages: ["numpy"],
    data: "m04",
    parts: [
      part("generation-loop", "p1", "Write the loop: ask for the next token, append it, and stop at end-of-sequence or max_new_tokens.", [
        "Loop `for _ in range(max_new_tokens)`, then `break` when the token is `eos_id`.",
        "Append each token to both `ids` (what the model sees next time) and `new` (what you return).",
      ]),
      part("generation-loop", "p2", "Cut a reply at the earliest stop sequence, checked on GPT-2's real greedy text.", [
        "`text.find(s)` gives where s starts; collect it for every stop that occurs.",
        "Cut at the smallest position: `text[:min(hits)]`.",
      ]),
      part("generation-loop", "p3", "Implement Hugging Face's repetition penalty and see it change GPT-2's greedy choice.", [
        "Loop over `set(seen_ids)` so each token is penalised once.",
        "Positive logit: divide by the penalty. Negative logit: multiply by it.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m04-loop-stop",
      prompt: "A reply ends mid-sentence and the API reports finish_reason \"length\". What happened?",
      options: [
        "The model produced its end-of-sequence token",
        "The maximum number of new tokens ran out before the model was done",
        "A stop sequence appeared",
        "The prompt was too long",
      ],
      correctIndex: 1,
      explanation: "\"length\" means the token limit (max_new_tokens / num_predict / max_tokens) ended the loop, not the model.",
    },
    {
      id: "m04-loop-prefill",
      prompt: "Why does each output token cost far more time than each prompt token?",
      options: [
        "Output tokens are longer",
        "The prompt is read in one parallel pass (prefill), while every output token needs its own sequential forward pass (decode)",
        "The model uses a bigger vocabulary for output",
        "Output tokens are checked for facts",
      ],
      correctIndex: 1,
      explanation: "On our CPU: 0.86 ms per prompt token in prefill, 26 ms per generated token in decode.",
    },
    {
      id: "m04-loop-penalty",
      prompt: "GPT-2's logits are negative. What does Hugging Face's repetition penalty of 1.2 do to a seen token with logit −80?",
      options: ["Divides it: −66.7, more likely", "Multiplies it: −96, less likely", "Sets it to −inf", "Nothing, because it's negative"],
      correctIndex: 1,
      explanation: "Negative logits are multiplied and positive ones divided, so a seen token always becomes less likely.",
    },
  ],
  oneSentence:
    "A decoder generates by looping: run the model, pick a token, append it and repeat, stopping at an end-of-sequence token, a token limit or a stop sequence, with a cheap parallel prefill for the prompt and one expensive decode pass per output token, while penalties can push the loop away from repeating itself.",
  deeper: [
    {
      label: "Hugging Face, Text generation (generate() and its parameters)",
      url: "https://huggingface.co/docs/transformers/main_classes/text_generation",
      adds: "max_new_tokens, eos_token_id, stop_strings, repetition_penalty and no_repeat_ngram_size, with their exact meanings.",
    },
    {
      label: "Keskar et al. 2019, CTRL: A Conditional Transformer Language Model",
      url: "https://arxiv.org/abs/1909.05858",
      adds: "Where the repetition penalty comes from.",
    },
    {
      label: "Pope et al. 2022, Efficiently Scaling Transformer Inference",
      url: "https://arxiv.org/abs/2211.05102",
      adds: "Prefill versus decode, and why decoding is limited by memory rather than arithmetic.",
    },
  ],
};
