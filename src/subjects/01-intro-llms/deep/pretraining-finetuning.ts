import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const pretrainingFinetuning: DeepLesson = {
  why: [
    "Training a model like Llama 3 from scratch costs millions of GPU-hours. No bank, hospital or start-up does that for each task they care about, and they don't need to, because of a two-stage recipe that has defined the field since 2018.",
    "**Stage 1, pre-training**: train once, at enormous cost, on a huge amount of general text, with a self-supervised task (predict the next token, or fill in blanks). Nobody has to label anything; the text is its own answer key. The result is a **base model** (also called a foundation model) that knows grammar, facts, styles and patterns of reasoning, but isn't tailored to any job.",
    "**Stage 2, fine-tuning**: take that base model and continue training it, briefly and cheaply, on a small dataset for your purpose: labelled tickets for a classifier, conversations for an assistant, your company's documents for a domain model. Because most of what's needed was learned in stage 1, stage 2 needs thousands of examples instead of trillions of tokens, and hours instead of months. This step shows the recipe with a bigram model you can inspect, including the risk that comes with it: fine-tune too hard and the model forgets what it knew.",
  ],
  worked: [
    {
      kind: "text",
      text: "**Pre-train** a bigram model on 19 tokens of general text (`the cat sat on the mat . the dog ate the food . the cat ate the fish .`). Then **fine-tune** it by continuing to count on 11 tokens of banking text (`the bank approved the loan . the loan was repaid .`). Here is what it predicts after `the`, before and after:",
    },
    {
      kind: "table",
      caption: "P(next | “the”) before and after fine-tuning",
      columns: ["next word", "pre-trained", "fine-tuned"],
      rows: [
        ["cat", 0.333, 0.222],
        ["mat", 0.167, 0.111],
        ["dog", 0.167, 0.111],
        ["food", 0.167, 0.111],
        ["fish", 0.167, 0.111],
        ["bank", 0, 0.111],
        ["loan", 0, 0.222],
      ],
      source: "worked/pretraining-finetuning.py",
    },
    {
      kind: "math",
      text: "pre-trained:  `the` was followed 6 times (cat 2, mat 1, dog 1, food 1, fish 1)   P(cat | the) = 2/6 = 0.333\nfine-tuned:   + 3 more (bank 1, loan 2) = 9 in total                     P(cat | the) = 2/9 = 0.222,  P(loan | the) = 2/9 = 0.222",
    },
    {
      kind: "text",
      text: "Eleven tokens of domain text moved the model a lot: `loan` went from impossible to tied for most likely, and it still knows about cats. That is fine-tuning in miniature. A real LLM changes its weights by gradient descent instead of adding counts, but the effect is the same shape: the general distribution shifts towards the new data.",
    },
  ],
  concept: [
    {
      heading: "Stage 1: pre-training",
      paragraphs: [
        "Pre-training uses **self-supervised** objectives: the labels come from the text itself. A decoder predicts every next token; an encoder fills in masked tokens. So any text at all is training data: web pages, books, code, papers. Llama 3 was pre-trained on over 15 trillion tokens. This is where almost all the compute goes, and where the model picks up nearly everything it knows.",
        "The product is a **base model**. A base model continues text; it does not follow instructions. Ask a base model `What is the capital of France?` and it may continue with more quiz questions, because that is what tends to follow such a line on the web. Making it answer is the job of the next stage.",
      ],
    },
    {
      heading: "Stage 2: fine-tuning",
      paragraphs: [
        "Fine-tuning is more training, starting from the pre-trained weights instead of random ones, on a much smaller, targeted dataset. The loss and the gradient steps are the same as in pre-training (the training step showed both); only the data changes, and usually the learning rate is lower so the model moves gently.",
        "There are several flavours, each covered later in the course. **Task fine-tuning** adds a small output head and trains on labelled examples (a ticket classifier). **Instruction tuning** trains on pairs of instructions and good responses, turning a base model into one that answers questions. **Preference tuning** (RLHF, DPO) trains on human comparisons of better and worse answers. **Domain adaptation** continues next-token training on specialist text (legal, medical, banking) so the model speaks the domain's language.",
      ],
      formula: {
        expr: "θ_pre = argmin_θ  L(θ; huge general text)          (from random θ)\nθ_ft  = argmin_θ  L(θ; small task data)            (starting at θ_pre)",
        symbols: [
          { sym: "θ", meaning: "all of the model's weights" },
          { sym: "L", meaning: "the training loss (cross-entropy on next tokens, or on labels)" },
          { sym: "argmin", meaning: "the weights that make the loss smallest, found by gradient descent" },
          { sym: "starting at θ_pre", meaning: "fine-tuning begins from the pre-trained weights, so it needs little data" },
        ],
        example: "Toy: θ_pre = counts from 19 general tokens; θ_ft = those counts plus 11 banking tokens. P(loan | the) goes from 0 to 0.222.",
      },
    },
    {
      heading: "Why it works: transfer",
      paragraphs: [
        "Fine-tuning works because what pre-training learned **transfers**. A model that has read billions of sentences already represents what a complaint sounds like, what money words mean, how questions are phrased. Classifying tickets then needs only a thin layer of new learning on top: which existing patterns map to which label. That is why a few thousand labelled tickets can produce an excellent classifier, when training the same model from scratch on those tickets alone would fail completely.",
        "This is also why the base model's quality caps the fine-tuned model's. Fine-tuning reshapes what is there; it adds little that is fundamentally new. If a skill or fact was never learned in pre-training, a small fine-tuning set rarely creates it reliably.",
      ],
    },
    {
      heading: "The risk: forgetting",
      paragraphs: [
        "Push fine-tuning too far (too many passes over the data, too high a learning rate, data that is too narrow) and the model's general abilities degrade. This is called **catastrophic forgetting**. In the toy, each extra pass over the banking text pushes P(cat | the) down: 0.222 after one pass, 0.03 after twenty. The model becomes a banking parrot. Real models show the same pattern: a model fine-tuned hard on one task may get worse at writing, reasoning or safety behaviour it had before.",
        "Practitioners guard against it with low learning rates, few passes (often one to three), mixing some general data into the fine-tuning set, and **parameter-efficient** methods such as LoRA that train a small number of extra weights and leave the original weights frozen. Part III builds these and measures the trade-off.",
      ],
      mistake:
        "Treating fine-tuning as a way to add knowledge, such as this month's policy changes. Fine-tuning is good at changing *behaviour and style*; it is unreliable for adding facts and is expensive to redo whenever they change. For facts that change, retrieval (Module 09) is usually the right tool.",
    },
    {
      heading: "How much data each stage needs",
      paragraphs: [
        "The two stages differ in scale by orders of magnitude. Llama 3 was pre-trained on over 15 trillion tokens. InstructGPT's supervised fine-tuning set held about 13,000 prompts with written demonstrations; its reward model was trained on about 33,000 prompts with human rankings. A task classifier is often fine-tuned well on a few thousand labelled examples.",
        "The cost follows the data. Using 6 · N · D, pre-training an 8B model on 15 trillion tokens is about 7 × 10²³ operations. Fine-tuning it on 10 million tokens of domain text is about 5 × 10¹⁷, more than a million times less. That gap is the whole economic case for the two-stage recipe: one organisation pays for pre-training, and everyone else adapts the result.",
      ],
    },
    {
      heading: "From base model to assistant",
      paragraphs: [
        "The chat assistants you use went through several stages: pre-training (next-token prediction on trillions of tokens), then supervised instruction tuning on curated conversations, then preference tuning so that answers are helpful, honest and safe. InstructGPT (2022) showed that a 1.3-billion-parameter model after these stages was preferred by people over the 175-billion-parameter base GPT-3: alignment stages change how usable a model is far more than their small compute cost would suggest.",
      ],
    },
  ],
  guided:
    "Predict first: does pre-training need labelled data? Watch Stage 1 below build its training examples from raw text alone, then compare with what Stage 2 needs.",
  build: {
    id: "01-pretrain-finetune",
    title: "Pre-train, fine-tune, then over-fine-tune",
    packages: [],
    parts: [
      part("pretraining-finetuning", "p1", "Finish `count(tokens, counts=None)` so it can both pre-train (start empty) and fine-tune (start from a copy of existing counts). P(loan | the) must go from 0 to **0.222**, and the base model must stay untouched.", [
        "The copy is already made for you in `new`; just add the pairs to it.",
        "`new.setdefault(a, {})`, then `new[a][b] = new[a].get(b, 0) + 1`.",
      ]),
      part("pretraining-finetuning", "p2", "Write `fine_tune(base, tokens, epochs)` that goes over the banking text several times, and watch general knowledge (`cat`) fade: catastrophic forgetting in miniature.", [
        "Start with `tuned = base`, then loop `epochs` times.",
        "Each pass: `tuned = count(tokens, tuned)`.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "pf-labels",
      prompt: "Why can pre-training use trillions of tokens when labelled datasets are usually tiny?",
      options: [
        "Labs pay people to label the whole web",
        "Its objective is self-supervised: the next (or hidden) token in the text is the label, so any raw text works",
        "Pre-training doesn't use a loss",
        "It only uses Wikipedia",
      ],
      correctIndex: 1,
      explanation: "Next-token prediction and masked-token prediction get their answers from the text itself, so no human labelling is needed and the data supply is effectively unlimited.",
    },
    {
      id: "pf-forget",
      prompt: "A team fine-tunes a model for 30 epochs on 2,000 legal documents. It now drafts contracts well but writes poor general emails. What most likely happened?",
      options: [
        "The tokenizer changed",
        "Catastrophic forgetting: heavy, narrow fine-tuning pulled the weights away from general abilities",
        "The context window shrank",
        "Pre-training was undone automatically",
      ],
      correctIndex: 1,
      explanation: "Too many passes over narrow data shift the weights too far. Fewer epochs, a lower learning rate, mixing in general data or using LoRA would reduce it.",
    },
    {
      id: "pf-facts",
      prompt: "Your bank's fees change every quarter and the assistant must quote current fees. What is usually the better approach?",
      options: [
        "Fine-tune the model on the new fee table every quarter",
        "Keep the model as is and retrieve the current fee table into the prompt when it's needed (RAG)",
        "Pre-train a new model each quarter",
        "Increase the temperature",
      ],
      correctIndex: 1,
      explanation: "Fine-tuning is unreliable for injecting changing facts and costly to repeat. Retrieval puts the current facts in front of the model at answer time.",
    },
  ],
  oneSentence:
    "Pre-training learns general language once from huge unlabelled text (expensive), and fine-tuning briefly continues training from those weights on a small targeted dataset (cheap), which transfers that knowledge to a task but can erase general skills if overdone.",
  deeper: [
    { label: "Radford et al. 2018, GPT", url: "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf", adds: "§3: \"unsupervised pre-training\" followed by \"supervised fine-tuning\", the recipe in its original form." },
    { label: "Ouyang et al. 2022, InstructGPT", url: "https://arxiv.org/abs/2203.02155", adds: "Instruction tuning and RLHF; the 1.3B-preferred-over-175B result." },
    { label: "Hu et al. 2021, LoRA", url: "https://arxiv.org/abs/2106.09685", adds: "Fine-tuning a few added weights while the original ones stay frozen (Part III builds it)." },
  ],
};
