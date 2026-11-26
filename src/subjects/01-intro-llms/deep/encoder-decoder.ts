import type { DeepLesson } from "../../../core/types";
import { localListing, part } from "./files";

export const encoderDecoder: DeepLesson = {
  why: [
    "Translation is the problem the transformer was invented for, and it has a particular shape. You have a complete input (`the cat sleeps`) that must become a different output (`le chat dort`), which might be longer, shorter, or in a different word order.",
    "Notice something: reading and writing are different jobs with different rules. The whole input is known up front. But the output has to be written one token at a time. So why not give each job its own machinery?",
    "That's exactly what an **encoder-decoder** model does. The **encoder** reads the full input in both directions and produces one contextual vector per input token. The **decoder** writes the output left to right, and at every step it looks back at all of the encoder's vectors to decide which part of the input matters right now. That look-back is called **cross-attention**, and it's the one genuinely new idea in this step. The original Transformer (2017) and T5 (2020) use this design, and it's still a strong choice for translation and summarisation. Once you've seen cross-attention, you'll also understand how decoder-only models pull off the same tasks with a single stack.",
  ],
  worked: [
    {
      kind: "text",
      text: "The encoder has read `the cat sleeps` and produced one vector per token (2 numbers each, hand-picked): the → (1, 0), cat → (0, 1), sleeps → (0.5, 0.5). The decoder has already written `le` and is about to write the next French word. Its current position produces a **query** q = (0.2, 1.0). Cross-attention scores q against every encoder vector:",
    },
    {
      kind: "math",
      text: "score(the)    = (0.2·1   + 1.0·0)   / √2 = 0.2 / 1.414 = 0.141\nscore(cat)    = (0.2·0   + 1.0·1)   / √2 = 1.0 / 1.414 = 0.707\nscore(sleeps) = (0.2·0.5 + 1.0·0.5) / √2 = 0.6 / 1.414 = 0.424",
    },
    {
      kind: "table",
      caption: "Cross-attention while writing “chat”",
      columns: ["input token", "score", "weight (softmax)"],
      rows: [
        ["the", 0.141, 0.245],
        ["cat", 0.707, 0.431],
        ["sleeps", 0.424, 0.325],
      ],
      source: "worked/encoder-decoder.py",
    },
    {
      kind: "text",
      text: "The largest weight lands on `cat`, the word being translated now. The mixed vector the decoder receives is 0.245·(1, 0) + 0.431·(0, 1) + 0.325·(0.5, 0.5) = (0.407, 0.593), mostly `cat` with some of the rest. In a trained model these weights form an **alignment**: as the decoder writes each French word, its attention moves across the English words it corresponds to, even when the order differs between the languages.",
    },
  ],
  concept: [
    {
      heading: "Two stacks with different rules",
      paragraphs: [
        "The **encoder** is a stack of encoder blocks: bidirectional self-attention plus feed-forward. Here's the key thing: it runs **once** per input, and outputs a T_in × d grid of contextual vectors, often called the **memory**. It doesn't generate anything. It only reads.",
        "The **decoder** is a stack of decoder blocks, and each one has **three** parts instead of two: causal self-attention over the output written so far, then cross-attention over the encoder's memory, then feed-forward. It runs once per output token, exactly like the generation loop from step 1, and its final vector goes to an output head that scores the vocabulary.",
      ],
      lab: {
        view: "two-stacks",
        label: "Who runs",
        task: "Write the translation one word at a time and watch the counters. How many times does the encoder run? How many times does the decoder?",
      },
    },
    {
      heading: "Cross-attention",
      paragraphs: [
        "Cross-attention is ordinary attention with one twist: the **queries** come from the decoder, while the **keys and values** come from the encoder. So each decoder position asks, \"which input words matter for what I'm writing right now?\", scores all of them, and mixes their vectors.",
        "And here's an important detail: there's **no causal mask** on this part. The whole input is already known, so every input word is fair game at every step.",
        "If you like shapes: with T_dec output positions and T_enc input tokens, the weight grid is T_dec × T_enc (one row per output position, one column per input token). The result is one d-wide vector per output position, the same shape as the decoder's own vectors, so it can be added straight back with a residual connection.",
      ],
formula: {
        expr: "CrossAttn = softmax(Q_dec · K_encᵀ / √d) · V_enc",
        symbols: [
          { sym: "Q_dec", meaning: "queries from the decoder positions (T_dec × d)" },
          { sym: "K_enc, V_enc", meaning: "keys and values computed from the encoder's output (T_enc × d)" },
          { sym: "T_dec × T_enc", meaning: "the weight grid: how much each output position attends to each input token" },
        ],
        example: "q = (0.2, 1.0) vs encoder vectors for the / cat / sleeps → weights 0.245 / 0.431 / 0.325 → output (0.407, 0.593).",
      },
      mistake:
        "Putting a causal mask on cross-attention. The decoder must not see future *output* tokens (that's its self-attention mask), but it may and should see the entire *input*. Masking the input would stop it from reading words that come later in the source sentence.",
      lab: {
        view: "cross-attention",
        label: "Cross-attention",
        task: "Start from the worked example's query and check the weights. Now move the query until `sleeps` gets the most attention. Then switch on the (wrong) causal mask: what can the decoder no longer read?",
      },
    },
    {
      heading: "Training and generating",
      paragraphs: [
        "Training uses pairs: an input and its target output (an English sentence and its French translation; an article and its summary). The encoder reads the input. The decoder is fed the *correct* output, shifted one position right. This trick is called **teacher forcing**: it predicts every next output token in parallel, and the loss is cross-entropy over the target tokens. T5 pre-trains this way on a huge amount of text with a self-made task: hide stretches of the input and have the decoder write them out.",
        "Generating is the familiar loop. Encode the input once. Start the decoder with a start token. At each step, run the decoder (self-attention over what it's written, cross-attention over the memory), choose a token, append it, and repeat until an end token. Encoding once and reusing the memory is what makes encoder-decoders efficient for long inputs with short outputs, like summarisation.",
        "But notice the difference between the two. In training, the decoder always sees the *right* previous words. In generation, it sees its *own* previous words, mistakes included.",
      ],
      lab: {
        view: "teacher-forcing",
        label: "Teacher forcing",
        task: "Compare what the decoder is fed in training and in generation. Now make the model get word 2 wrong: in which mode does that mistake spread to later steps?",
      },
    },
    {
      heading: "What it costs to run",
      paragraphs: [
        "The encoder runs once per input. Its self-attention compares every input token with every other, so its cost grows with the square of the input length (T_in²). The decoder runs once per output token. At each step, its self-attention compares the new token with the outputs so far, and its cross-attention compares it with all T_in input vectors. The encoder memory's keys and values are computed once and reused at every step.",
        "So an encoder-decoder pays for the long input once, then generates cheaply against it. That suits jobs like summarising a long article into a few sentences, or translating sentence by sentence. When the output is long and open-ended (an essay, a conversation), the separate input stack buys less, which is another reason chat models are decoder-only.",
      ],
      lab: {
        view: "encdec-cost",
        label: "Cost",
        task: "Set a long input (5,000 tokens) and a short output (100). Which part of the work dominates? Now flip it: short input, long output.",
      },
    },
    {
      heading: "How decoder-only models do the same job",
      paragraphs: [
        "So how does a decoder-only model translate, with no encoder and no cross-attention? It puts everything in one sequence: `Translate to French: the cat sleeps ⇒`, and then just keeps going. The input tokens sit earlier in the same context, so ordinary causal self-attention can look back at them. It plays exactly the role cross-attention plays in an encoder-decoder.",
        "What's the catch? The input is read with a causal mask (each input token sees only what came before it), and it's reprocessed as part of the growing sequence. The benefit is one simple architecture for every task, trained on raw text. At large scale, that simplicity won. That's why most of today's LLMs are decoder-only, while encoder-decoders remain common in translation systems and as efficient task-specific models.",
      ],
      lab: {
        view: "decoder-only",
        label: "One sequence",
        task: "Slide through the French words. While writing `chat`, which English words can the model see? Where's its \"encoder\"?",
      },
    },
    {
      heading: "Seeing it in practice",
      paragraphs: [
        "T5 frames every task as text to text. The input starts with a task prefix like `translate English to German:` or `summarize:`, and the decoder writes the answer. Running the small 60-million-parameter T5 locally (the \"Run it locally\" listing below) shows the whole design in a few lines of code: the tokenizer, the encoder reading once, the decoder generating with cross-attention.",
        "And its real output is a great reality check. It gets the German right (`Das Haus ist wunderbar.`), but writes `Le chat dorme.` for the French, a grammar slip (the right form is `dort`). Small models make small mistakes, which is exactly why model size and evaluation matter.",
      ],
      lab: {
        view: "t5-run",
        label: "Real T5 run",
        task: "Read the real output. Which translation is right, and which has a mistake? How would you catch mistakes like this automatically?",
      },
    },
  ],
  guided:
    "Predict first: when the decoder writes `chat`, which English word should get the most attention? Check in **Cross-attention**. Then step through the translation in the **Overview** and watch which input word each output word lines up with.",
  build: {
    id: "01-encoder-decoder",
    title: "Write cross-attention and use it to translate",
    packages: ["numpy"],
    parts: [
      part("encoder-decoder", "p1", "Write `cross_attention(Q, H)`: decoder queries attend over **all** encoder outputs (no mask). It must reproduce the worked example: weights 0.245 / 0.431 / 0.325.", [
        "Scores: `Q @ H.T / np.sqrt(d)` gives one row per decoder position, one column per input token.",
        "Softmax each row, then `weights @ H`.",
      ]),
      part("encoder-decoder", "p2", "Write `translate(H, queries, src_words, lexicon)`: a toy decoder that, for each query, translates the input word with the most cross-attention weight.", [
        "`q[None, :]` turns one query into a 1 × d matrix for `cross_attention`.",
        "`int(w.argmax())` is the index of the most-attended input word.",
      ]),
    ],
  },
  local: [localListing("encdec", "transformers: T5-small translating", ["transformers", "sentencepiece", "torch"])],
  checks: [
    {
      id: "ed-shape",
      prompt: "An English input has 7 tokens; the decoder has written 4 French tokens so far. What is the shape of the cross-attention weight grid in one decoder layer?",
      options: ["7 × 7", "4 × 7: one row per output position, one column per input token", "4 × 4", "7 × 4"],
      correctIndex: 1,
      explanation: "Queries come from the 4 decoder positions, keys from the 7 encoder vectors. (The decoder's self-attention grid is the separate 4 × 4 one, with a causal mask.)",
    },
    {
      id: "ed-mask",
      prompt: "Which attention in an encoder-decoder model uses a causal mask?",
      options: [
        "Only the decoder's self-attention over the output written so far",
        "The encoder's self-attention",
        "Cross-attention",
        "All three",
      ],
      correctIndex: 0,
      explanation: "The encoder reads the known input bidirectionally; cross-attention may see the whole input; only the decoder's attention over its own output must hide the future.",
    },
  ],
  oneSentence:
    "An encoder-decoder reads the whole input once with an encoder, then writes the output with a decoder whose cross-attention lets every output step look back at every input token.",
  deeper: [
    { label: "Vaswani et al. 2017, Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", adds: "§3.1–3.2.3: the encoder and decoder stacks and the three ways attention is used, including encoder-decoder attention." },
    { label: "Raffel et al. 2020, T5", url: "https://arxiv.org/abs/1910.10683", adds: "The text-to-text framing, task prefixes and span-corruption pre-training." },
    { label: "Bahdanau et al. 2015, Neural Machine Translation by Jointly Learning to Align and Translate", url: "https://arxiv.org/abs/1409.0473", adds: "Where attention as soft alignment between source and target words began, with alignment plots." },
  ],
};
