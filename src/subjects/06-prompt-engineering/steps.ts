import type { LessonStep } from "../../core/types";

/**
 * Every number in this module comes from recorded runs: 16 prompt variants × 8 tickets × 4 samples, for
 * gemma4:12b and qwen2.5-coder:1.5b (claims.test.ts checks the statements below against the recordings).
 */
export const steps: LessonStep[] = [
  {
    id: "prompt-matters",
    title: "The prompt is the program",
    summary: "Modules 04 and 05 used one-line prompts. Here we change the prompt piece by piece and measure what each piece really does.",
    body: [
      "With a pretrained LLM you don't change the weights to get a different behaviour: you change the **prompt**. Prompt engineering is writing that input well, and checking that it works.",
      "The task: read a bank ticket and return four fields as JSON (category, amount, currency, urgent). We have 8 tickets with known answers, so every prompt can be **scored**.",
      "Every prompt variant was sent to two real models, a 12-billion-parameter gemma4 and a 1.5-billion-parameter qwen2.5-coder, four times per ticket. Nothing here is hand-written.",
    ],
    tryIt: "Look at the ticket and the correct JSON on the right.",
    keyTakeaway: "Prompts are programs for LLMs, so treat them like code: test them on cases with known answers.",
    view: "intro",
  },
  {
    id: "anatomy",
    title: "Anatomy of a prompt",
    summary: "A full prompt has parts: a role, examples, the instruction and output format, a reasoning cue, the input, and optionally a schema.",
    body: [
      "**Role / system prompt**: who the model should act as. **Examples** (few-shot): solved cases to imitate. **Instruction**: the task and the output format. **Reasoning cue**: “think step by step”. **Input**: the actual ticket. **Schema**: a machine-checkable output shape.",
      "On the right is the prompt with every part switched on. The next steps switch them on one at a time.",
    ],
    tryIt: "Find each coloured part in the full prompt.",
    keyTakeaway: "Role, examples, instruction, reasoning, input and output format are separate, testable parts.",
    view: "anatomy",
  },
  {
    id: "few-shot",
    title: "Zero-shot vs few-shot",
    summary: "Few-shot prompts include solved examples. They don't always help: on this task they made the small model slightly worse.",
    body: [
      "**Zero-shot**: just the instruction. **Few-shot**: the instruction plus a couple of solved examples in the prompt (**in-context learning**: no weights change).",
      "Examples help most when the format or conventions are unusual. Here the instruction is already clear: gemma4 is perfect either way, and qwen 1.5B actually scores a little *lower* with examples, while the prompt gets about 100 tokens longer.",
      "Switch the model above the comparison and check the numbers yourself.",
    ],
    tryIt: "Compare both models: which one is affected by the examples?",
    keyTakeaway: "Few-shot examples are a tool, not a rule: measure whether they help your task and model.",
    callout: "cost: every example is paid for in prompt tokens on every call",
    view: "fewshot",
  },
  {
    id: "role",
    title: "Roles and system prompts",
    summary: "A system prompt sets who the model is and the house rules. Its effect is real but usually small.",
    body: [
      "Chat models accept a separate **system** message. Teams use it for persona, tone and rules (“never guess values that aren't in the message”).",
      "On this task a role changes little for either model. Its value grows with rules the model wouldn't follow by default, and it costs tokens on every call.",
    ],
    tryIt: "Switch to the small model and compare its consistency with and without the role.",
    keyTakeaway: "System prompts carry persona and rules; check their effect like any other change.",
    view: "role",
  },
  {
    id: "cot",
    title: "Chain-of-thought",
    summary: "Asking for step-by-step reasoning first helps big models on hard problems, but here it slowed gemma4 down and hurt the small model.",
    body: [
      "**Chain-of-thought** (Wei et al. 2022) asks the model to reason before answering. Each reasoning token is another forward pass, so answers take several times longer.",
      "On this simple extraction task gemma4 gains nothing. The 1.5B model does worse: it sometimes loses the output format after reasoning and gets fewer fields right.",
      "Reasoning pays off on multi-step problems (maths, planning), especially with large models. It isn't free, and it isn't always better.",
    ],
    tryIt: "Pick the small model and read a chain-of-thought answer that went wrong.",
    keyTakeaway: "Step-by-step reasoning costs tokens and time; it helps hard problems, not every problem.",
    callout: "latency ∝ output tokens (one forward pass each)",
    view: "cot",
  },
  {
    id: "structured",
    title: "Structured outputs (JSON schema)",
    summary: "With a schema, Ollama only lets the model pick tokens that keep the JSON valid. Both models produced valid JSON every time.",
    body: [
      "Asking for JSON in words usually works, but not always: the small model sometimes wraps it in prose or breaks a field type. Software downstream needs it to parse every time.",
      "**Structured outputs** pass a JSON schema as Ollama's `format`. During decoding (Module 03) the next-token choices are restricted to those that keep the output valid against the schema.",
      "In the recordings, every variant with the schema produced valid JSON on every sample, for both models.",
    ],
    tryIt: "Pick the small model and compare the Valid JSON counts.",
    keyTakeaway: "Schemas turn “please reply in JSON” into a guarantee by constraining decoding.",
    callout: "format = JSON schema → only schema-valid tokens can be sampled",
    view: "schema",
  },
  {
    id: "builder",
    title: "The prompt builder",
    summary: "Switch the four parts on and off and see the recorded accuracy, validity, consistency and prompt size of all 16 combinations.",
    body: [
      "Each combination was run 4 times per ticket: once at temperature 0 (scored for accuracy) and three times at 0.8 (to see how much the answers vary).",
      "**Answers per ticket** counts how many different answers the 4 samples gave: 1 means always the same. **Prompt tokens** is the model's own count.",
      "Edit the ticket text to try your own: there's no recording for it, so connect your Ollama to run it live.",
    ],
    tryIt: "Find the most accurate and the most consistent combination for the small model.",
    keyTakeaway: "Measure every prompt change on a test set: accuracy, validity, consistency and cost together.",
    view: "builder",
  },
  {
    id: "inspector",
    title: "The probability inspector",
    summary: "Every output token came with its probability and the runner-up tokens. Low-probability tokens show where the model hesitated.",
    body: [
      "Ollama returned the **log-probabilities** of each generated token and the top alternatives (Module 03's softmax, made visible). Click a token to see what else the model considered.",
      "Hesitation tends to sit in the hard parts: an amount written in words, an ambiguous currency, whether something is urgent. Low probability doesn't prove an error, but it's a cheap signal for review.",
    ],
    tryIt: "Pick ticket “two thousand five hundred rupees” and inspect the amount token.",
    keyTakeaway: "Token probabilities show where a model was unsure, which is useful for routing answers to review.",
    callout: "p(token) = exp(logprob)",
    view: "inspector",
  },
  {
    id: "chain",
    title: "Prompt chaining",
    summary: "Split a job into steps: extract the fields as JSON, then write the customer reply from that JSON.",
    body: [
      "Instead of one prompt doing everything, a **chain** passes the output of one prompt into the next. Step 1 extracts structured data; step 2 writes a reply using it.",
      "Each step is simpler, can be tested on its own, and the JSON from step 1 can also go to other systems (routing, dashboards). Both steps here were recorded from gemma4:12b.",
    ],
    tryIt: "Read step 2's prompt and spot where step 1's JSON was inserted.",
    keyTakeaway: "Chains break a task into small, checkable prompts that feed each other.",
    view: "chain",
  },
  {
    id: "recap",
    title: "Up next: memory, tools and agents",
    summary: "So far every call was a single question and answer. Module 07 makes LLMs remember, run smaller, and act through tools.",
    body: [
      "You can now build prompts from parts and judge them by measurement, not impressions.",
      "**Module 07** looks at what happens around the prompt: fitting a conversation into the context window, running quantized models on smaller GPUs, and agents that call tools in a loop.",
    ],
    tryIt: "Take the practice check, then continue to Module 07.",
    keyTakeaway: "Prompt engineering is measured engineering: parts, tests, numbers.",
    view: "recap",
  },
];
