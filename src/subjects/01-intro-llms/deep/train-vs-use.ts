import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const trainVsUse: DeepLesson = {
  why: [
    "The anatomy step ended with an untrained toy that thought `sat` should follow `the cat sat`. Its parts were right; its numbers were not. Getting from random numbers to numbers that predict English is **training**. Using the finished numbers to answer you is **inference**. They are different activities with wildly different costs, and confusing them is behind many misunderstandings about LLMs: \"does it learn from my chats?\", \"why is training so expensive if answering is cheap?\", \"why can't it just update itself with today's news?\".",
    "Training is a search. The model starts with billions of random weights. It reads a piece of text, predicts every next token, measures how wrong it was with a single number (the **loss**), works out which way each weight should move to make the loss smaller, moves them all a tiny bit, and repeats. It does this for trillions of tokens. That is why it needs thousands of GPUs for weeks.",
    "Inference is just the forward pass you built in the anatomy step, run with the finished weights, once per generated token. No weights change. This step makes both concrete: you'll compute a loss, run real gradient descent on a one-weight model and watch it learn, then estimate the compute for training Llama 3 8B against the compute for one token of its output.",
  ],
  worked: [
    {
      kind: "text",
      text: "**Measuring wrongness.** For each position the model outputs a probability for every token. The loss looks only at the probability it gave to the token that actually came next, and takes minus its logarithm. This is called **cross-entropy**. Our untrained toy gave the right next token probabilities like 0.179:",
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
      text: "**Learning by gradient descent.** Shrink the model to a single weight w that predicts y = w · x, with one training example: x = 2, the right answer y = 6 (so the ideal w is 3). The loss is (w·x − y)². Its **gradient**, the slope telling you which way and how steeply the loss changes as w changes, is 2·(w·x − y)·x. Each step moves w against the gradient by a **learning rate** of 0.05:",
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
      text: "The loss falls from 16 to 0.27 in five steps and w heads towards 3. An LLM does exactly this, except w is 8 billion weights, the gradient is computed for all of them at once (by an algorithm called **backpropagation**), and the loss is cross-entropy averaged over millions of tokens per step.",
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
        "Training needs one number that says how badly the model is doing, so that \"better\" has a direction. For language models that number is the average **cross-entropy** over every position in a batch of text: for each position, take the probability the model gave to the token that really came next, and add up minus its logarithm.",
        "The logarithm is what makes it work. Giving the right token probability 0.99 costs almost nothing (0.01); 0.5 costs 0.69; 0.179 costs 1.72; and as the probability heads towards 0 the cost goes to infinity. So the model is punished hardest for being confidently wrong, and the only way to drive the loss down is to put high probability on what actually comes next, across trillions of examples.",
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
    },
    {
      heading: "One step of learning",
      paragraphs: [
        "To make the loss smaller you need to know, for each weight, whether nudging it up would make the loss go up or down, and how strongly. That is the **gradient**: one number per weight. For our one-weight model it was 2·(w·x − y)·x, which you can work out by hand. For an LLM, **backpropagation** computes all billions of them at once by applying the chain rule of calculus backwards through every layer; deep-learning libraries do it for you automatically.",
        "Then every weight takes a small step in the opposite direction of its gradient: w ← w − learning rate × gradient. Too large a learning rate and the weights overshoot and the loss explodes; too small and training takes forever. Real training uses an improved stepping rule called **Adam** and changes the learning rate over the course of training, but the idea is exactly the five-row table above.",
        "One pass of predict → measure loss → compute gradients → step is one **training step**. Llama 3 8B took hundreds of thousands of such steps, each on millions of tokens at once.",
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
    },
    {
      heading: "Inference: running frozen weights",
      paragraphs: [
        "Once training stops, the weights are frozen and saved. Inference loads them and runs the forward pass: tokenize the prompt, run it through every block, read the probabilities, choose a token, append it, repeat. There is no loss, no gradient, no step. The same prompt with the same settings and greedy decoding gives the same answer every time.",
        "Because nothing is learned, a model's knowledge is fixed at its **training cutoff**: it cannot know about events after its training data was collected unless you paste the information into the prompt. Module 09 builds exactly that workaround (retrieval-augmented generation).",
      ],
    },
    {
      heading: "Compute: why training costs so much more",
      paragraphs: [
        "A useful rule from the scaling-law research (Kaplan et al. 2020): a forward pass costs about **2 floating-point operations per parameter per token** (each weight is used in one multiply and one add). Training costs about **6 per parameter per token**: the forward pass, plus roughly twice that again to compute the gradients backwards.",
        "Plug in Llama 3 8B, trained on about 15 trillion tokens: 6 × 8.03 billion × 15 trillion ≈ 7.2 × 10²³ operations. Generating one token costs 2 × 8.03 billion ≈ 1.6 × 10¹⁰. The training compute would pay for about 45 trillion generated tokens. Meta reports about 1.3 million H100 GPU-hours for the 8B model's pre-training.",
        "The two costs are paid differently. Training is paid once, by the model's maker. Inference is paid on every token by everyone who uses the model, so across millions of users it adds up, which is why Part IV of this course is about making inference cheap.",
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
    },
    {
      heading: "Where this goes in the course",
      paragraphs: [
        "Part II uses trained models as they are: inference only, the weights never change. Part III changes weights again, much more cheaply than pre-training, by fine-tuning on a small dataset. Part IV makes inference fast and affordable at scale. Knowing which side of the line you are on, writing weights or reading them, tells you what a technique can and cannot do.",
      ],
    },
  ],
  guided:
    "Predict first: which number is bigger, the training compute or the compute for a billion generated tokens? Compare the two panels below, then work out how many tokens you'd need to generate before inference had cost as much as training.",
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
