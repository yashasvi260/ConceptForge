import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const trainVsUse: DeepLesson = {
  why: [
    "Remember the untrained toy from the anatomy step? It thought `sat` should follow `the cat sat`. Its parts were right; its numbers were wrong. So how do you get from random numbers to numbers that predict English?",
    "That's **training**. And using the finished numbers to answer you is **inference**. They sound similar, but they're completely different activities with wildly different costs. Mixing them up is behind a lot of confusion about LLMs. \"Does it learn from my chats?\" \"Why is training so expensive if answering is cheap?\" \"Why can't it just update itself with today's news?\"",
    "Here's the short version. Training is a search. The model starts with billions of random weights, reads some text, predicts every next token, and measures how wrong it was with a single number, the **loss**. Then it works out which way each weight should move to make the loss smaller, moves them all a tiny bit, and repeats. For trillions of tokens. That's why it needs thousands of GPUs for weeks.",
    "Inference is just the forward pass you built in the anatomy step, run with the finished weights, once per generated token. No weight changes. In this step you'll compute a loss, train a one-weight model by hand and watch it learn (and blow up), and compare the cost of training Llama 3 8B with the cost of one token of its output.",
  ],
  worked: [
    {
      kind: "text",
      text: "**Measuring wrongness.** First we need a number for \"how wrong\". For each position the model outputs a probability for every token. The loss looks only at the probability it gave to the token that actually came next, and takes minus its logarithm. This is called **cross-entropy**. Our untrained toy gave the right next token probabilities like 0.179. How bad is that?",
    },
    {
      kind: "table",
      caption: "Cross-entropy loss for the correct next token",
      columns: ["probability on the right token", "loss = −ln(p)"],
      rows: [
        [0.179, 1.72],
        [0.5, 0.693],
        [0.9, 0.105],
        [0.99, 0.01],
      ],
      source: "worked/train-vs-use.py",
    },
    {
      kind: "text",
      text: "**Learning by gradient descent.** Now let's actually learn something. Shrink the model to a single weight w that predicts y = w · x, with one training example: x = 2, the right answer y = 6 (so the ideal w is 3). The loss is (w·x − y)². Its **gradient**, the slope telling you which way and how steeply the loss changes as w changes, is 2·(w·x − y)·x. Each step moves w against the gradient by a **learning rate** of 0.05:",
    },
    {
      kind: "math",
      text: "step 1:  prediction = 1 × 2 = 2,  loss = (2 − 6)² = 16\n         gradient = 2 × (2 − 6) × 2 = −16\n         new w = 1 − 0.05 × (−16) = 1.8",
    },
    {
      kind: "table",
      caption: "Five steps of gradient descent on prediction = w · x",
      columns: ["step", "w", "prediction", "loss", "gradient", "new w"],
      rows: [
        [1, 1, 2, 16, -16, 1.8],
        [2, 1.8, 3.6, 5.76, -9.6, 2.28],
        [3, 2.28, 4.56, 2.0736, -5.76, 2.568],
        [4, 2.568, 5.136, 0.7465, -3.456, 2.7408],
        [5, 2.7408, 5.4816, 0.2687, -2.0736, 2.8445],
      ],
      source: "worked/train-vs-use.py",
    },
    {
      kind: "text",
      text: "Look at that: the loss falls from 16 to 0.27 in five steps, and w heads towards 3. That's learning! An LLM does exactly this, except w is 8 billion weights, the gradient is computed for all of them at once (by an algorithm called **backpropagation**), and the loss is cross-entropy averaged over millions of tokens per step.",
    },
    {
      kind: "table",
      caption: "Compute for Llama 3 8B",
      columns: ["what", "floating-point operations"],
      rows: [
        ["training: 6 · N · D", "7.23e+23"],
        ["one generated token: 2 · N", "1.61e+10"],
        ["tokens you could generate with the training compute", "4.5e+13"],
      ],
      source: "worked/train-vs-use.py",
    },
  ],
  concept: [
    {
      heading: "What training minimises",
      paragraphs: [
        "To get better, a model needs one number that says how badly it's doing, so that \"better\" has a direction. For language models, that number is the average **cross-entropy**. For every position in a batch of text, take the probability the model gave to the token that really came next, and add up minus its logarithm.",
        "Why a logarithm? Watch what it does. Giving the right token 0.99 costs almost nothing (0.01). Giving it 0.5 costs 0.69. Giving it 0.179 costs 1.72. And as the probability heads towards 0, the cost shoots off towards infinity. So the model is punished hardest for being *confidently wrong*. The only way to drive the loss down is to put high probability on what actually comes next, across trillions of examples.",
      ],
      formula: {
        expr: "loss = −(1/T) · Σₜ ln p(xₜ₊₁ | x₁ … xₜ)",
        symbols: [
          { sym: "T", meaning: "the number of positions in the batch" },
          { sym: "p(xₜ₊₁ | …)", meaning: "the probability the model gave to the token that really came next" },
          { sym: "ln", meaning: "the natural logarithm" },
          { sym: "Σₜ", meaning: "add up over every position" },
        ],
        example: "Two positions where the model gave the right token 0.9 and 0.179: loss = (0.105 + 1.72) / 2 ≈ 0.91.",
      },
      lab: {
        view: "loss",
        label: "Loss",
        task: "Drag the probability towards 0 and watch the loss explode. Then look at gemma4's real predictions: which one would cost it the most loss, and why?",
      },
    },
    {
      heading: "One step of learning",
      paragraphs: [
        "So we have a loss. How do we make it smaller? For each weight, we need to know: if I nudge it up, does the loss go up or down, and by how much? That's the **gradient**, one number per weight.",
        "For our one-weight model it was 2·(w·x − y)·x, which you can work out by hand. For an LLM, an algorithm called **backpropagation** computes all billions of them at once, by applying the chain rule of calculus backwards through every layer. You never do this by hand; deep-learning libraries do it automatically.",
        "Then every weight takes a small step *against* its gradient: w ← w − learning rate × gradient. Here's the catch. Make the learning rate too large and the weights overshoot, and the loss explodes. Too small and training takes forever. Real training uses a smarter stepping rule called **Adam** and changes the learning rate as it goes, but the idea is exactly the five-row table above.",
        "One round of predict → measure loss → compute gradients → step is one **training step**. Llama 3 8B took hundreds of thousands of them, each on millions of tokens at once.",
      ],
      formula: {
        expr: "w ← w − η · ∂loss/∂w",
        symbols: [
          { sym: "w", meaning: "any one weight (training updates all of them at once)" },
          { sym: "η", meaning: "the learning rate: how big a step to take" },
          { sym: "∂loss/∂w", meaning: "the gradient: how the loss changes when w changes a little" },
        ],
        example: "w = 1, gradient −16, η = 0.05: w ← 1 − 0.05 × (−16) = 1.8.",
      },
      mistake:
        "Thinking the model learns from each conversation as it chats. Chatting is inference: the forward pass runs, nothing computes a loss or a gradient, and no weight moves. A chatbot \"remembers\" earlier messages only because the application sends them again as part of the context.",
      lab: {
        view: "gradient",
        label: "Gradient descent",
        task: "Take ten steps at learning rate 0.05 and watch w approach 3. Reset, and try 0.2, then 0.3. Where does it stop learning and start blowing up?",
      },
    },
    {
      heading: "Inference: running frozen weights",
      paragraphs: [
        "When training stops, the weights are frozen and saved. Inference loads them and runs the forward pass: tokenize the prompt, run it through every block, read the probabilities, choose a token, append it, repeat. No loss. No gradient. No step.",
        "So why do chatbots give different answers to the same question? Not because they changed! The probabilities are identical every time; the variety comes only from *sampling* (step 1). With greedy decoding, the same prompt gives the same answer every single time.",
        "And because nothing is learned, a model's knowledge is frozen at its **training cutoff**. It can't know about anything that happened after its training data was collected, unless you paste the information into the prompt. Module 09 builds exactly that workaround (retrieval-augmented generation).",
      ],
      lab: {
        view: "frozen",
        label: "Frozen weights",
        task: "Generate five replies at temperature 1, then five at 0. The weights never changed between runs. So where does the variety come from?",
      },
    },
    {
      heading: "Compute: why training costs so much more",
      paragraphs: [
        "There's a handy rule from the scaling-law research (Kaplan et al. 2020). A forward pass costs about **2 operations per parameter per token**: each weight is used in one multiply and one add. Training costs about **6 per parameter per token**: the forward pass, plus roughly twice that again to compute the gradients backwards.",
        "Let's plug in Llama 3 8B, trained on about 15 trillion tokens. Training: 6 × 8.03 billion × 15 trillion ≈ 7.2 × 10²³ operations. One generated token: 2 × 8.03 billion ≈ 1.6 × 10¹⁰. So the training compute would pay for about 45 trillion generated tokens! Meta reports about 1.3 million H100 GPU-hours for the 8B model's pre-training.",
        "But notice who pays. Training is paid once, by the model's maker. Inference is paid on every token, by everyone who uses the model. Across millions of users that adds up fast, which is why Part IV of this course is all about making inference cheap.",
      ],
      formula: {
        expr: "C_train ≈ 6 · N · D        C_token ≈ 2 · N",
        symbols: [
          { sym: "N", meaning: "the number of parameters" },
          { sym: "D", meaning: "the number of training tokens" },
          { sym: "C", meaning: "compute, in floating-point operations (FLOPs)" },
        ],
        example: "N = 8.03 × 10⁹, D = 15 × 10¹²: C_train ≈ 7.23 × 10²³ FLOPs; C_token ≈ 1.61 × 10¹⁰ FLOPs.",
      },
      mistake:
        "Treating these as exact. 6·N·D and 2·N ignore attention's extra cost for long contexts and the overheads of real hardware; they are the standard first estimate, accurate to within a small factor, not a bill.",
      lab: {
        view: "compute",
        label: "Train vs answer",
        task: "Pick Llama 3 8B and set a busy service's usage. How long until answering questions has cost as much compute as training did? Now try GPT-3.",
      },
    },
    {
      heading: "Where this goes in the course",
      paragraphs: [
        "Now you can sort every technique in this course into one of two boxes: does it *write* weights, or only *read* them?",
        "Part II uses trained models exactly as they are: inference only, weights never change. Part III changes weights again, but far more cheaply than pre-training, by fine-tuning on a small dataset. Part IV makes inference fast and affordable at scale. Knowing which box you're in tells you what a technique can and can't do.",
      ],
      lab: {
        view: "map",
        label: "Course map",
        task: "Look at the learning map and sort the four parts: which ones read weights only, and which ones write them?",
      },
    },
  ],
  guided:
    "Before you open **Train vs answer**, guess: does training Llama 3 8B cost more compute than generating a billion tokens with it? A trillion? Then check, and work out what that means for a service with millions of users.",
  build: {
    id: "01-train-vs-use",
    title: "Train a model (a very small one) and price a big one",
    packages: [],
    parts: [
      part("train-vs-use", "p1", "Write `cross_entropy(p_correct)`, the loss for one prediction.", ["It is minus the natural log: `-math.log(p)`.", "`math.log(1)` is 0, so a perfect prediction costs nothing."]),
      part("train-vs-use", "p2", "Write `train_step(w, x, y, lr)`: one step of gradient descent on (w·x − y)². Your w should go 1 → 1.8 → 2.28 → … → 3.", [
        "The gradient is `2 * (w * x - y) * x`.",
        "Step *against* it: `return w - lr * gradient`.",
      ]),
      part("train-vs-use", "p3", "Write `train_flops(n_params, n_tokens)` and `flops_per_generated_token(n_params)` and price Llama 3 8B.", ["6 per parameter per token for training.", "2 per parameter for each generated token."]),
    ],
  },
  local: [],
  checks: [
    {
      id: "tu-chat",
      prompt: "You tell a chatbot your name, then start a brand-new conversation. Why doesn't it know your name?",
      options: [
        "It learned your name, but forgets after an hour",
        "Chatting is inference: no weights change, and the new conversation's context doesn't contain the old messages",
        "Its training cutoff is too old",
        "Names are removed by the tokenizer",
      ],
      correctIndex: 1,
      explanation: "Only training changes weights. Within one conversation the earlier messages are re-sent as context; a new conversation starts with an empty context (unless an app adds a memory feature that pastes notes back in).",
    },
    {
      id: "tu-lr",
      prompt: "In the one-weight example, what happens if the learning rate is 0.5 instead of 0.05?",
      options: [
        "It learns 10× faster and lands exactly on 3",
        "Each step overshoots: from w = 1 the gradient −16 gives w = 9, and the loss grows instead of shrinking",
        "Nothing changes",
        "The gradient becomes zero",
      ],
      correctIndex: 1,
      explanation: "w = 1 − 0.5 × (−16) = 9; then prediction 18, gradient 2·12·2 = 48, w = 9 − 24 = −15… The steps are too big and training diverges, which is why learning rates are chosen carefully.",
    },
    {
      id: "tu-double",
      prompt: "A lab trains the same model on twice as many tokens. Using 6·N·D, what happens to the training compute and to the cost of each generated token?",
      options: ["Both double", "Training compute doubles; the per-token inference cost stays the same", "Neither changes", "Only inference cost doubles"],
      correctIndex: 1,
      explanation: "D only appears in the training formula. Inference cost depends on N alone, which is why labs are happy to train smaller models on far more data.",
    },
  ],
  oneSentence:
    "Training searches for good weights by repeatedly measuring cross-entropy loss and stepping every weight against its gradient (about 6·N·D operations); inference runs the frozen weights once per token (about 2·N) and never changes them.",
  deeper: [
    { label: "Kaplan et al. 2020, Scaling Laws for Neural Language Models", url: "https://arxiv.org/abs/2001.08361", adds: "§2.1 derives the 2N forward and 6N training FLOPs-per-token estimates." },
    { label: "Llama 3 model card", url: "https://github.com/meta-llama/llama3/blob/main/MODEL_CARD.md", adds: "Training data size (15T+ tokens), knowledge cutoff and the reported GPU-hours." },
    { label: "3Blue1Brown, Gradient descent, how neural networks learn", url: "https://www.3blue1brown.com/lessons/gradient-descent", adds: "A visual, free explanation of gradients and stepping downhill (the next lessons cover backpropagation)." },
  ],
};
