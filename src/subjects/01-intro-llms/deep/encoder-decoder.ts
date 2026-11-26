import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const encoderDecoder: DeepLesson = {
  why: [
    "Translation was the problem the transformer was invented for. It has a particular shape: a complete input (`the cat sleeps`) that must be turned into a different output (`le chat dort`), which may be longer, shorter, or in a different word order. Reading the input and writing the output are different jobs, and they have different rules: the whole input is known up front, but the output must be written one token at a time.",
    "An **encoder-decoder** model gives each job its own stack. The **encoder** reads the full input with bidirectional attention and produces one contextual vector per input token. The **decoder** writes the output left to right with a causal mask, and at every step also looks back at all of the encoder's vectors to decide which part of the input matters now. That look-back is called **cross-attention**, and it is the one new idea in this step.",
    "The original Transformer (2017) and T5 (2020) use this design, and it is still a strong choice for translation, summarisation and other input-to-output tasks. Seeing cross-attention also explains how decoder-only models manage the same tasks with a single stack.",
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
        "The **encoder** is a stack of encoder blocks: bidirectional self-attention plus feed-forward. It runs **once** per input and outputs a T_in × d grid of contextual vectors, often called the **memory**. Nothing in it is generated; it only reads.",
        "The **decoder** is a stack of decoder blocks, each with **three** parts instead of two: causal self-attention over the output written so far, then cross-attention over the encoder's memory, then feed-forward. It runs once per output token, exactly like the generation loop from step 1, and its final vector goes to an output head that scores the vocabulary.",
      ],
    },
    {
      heading: "Cross-attention",
      paragraphs: [
        "Cross-attention is ordinary attention with one twist: the **queries** come from the decoder, while the **keys and values** come from the encoder. So each decoder position asks \"which input tokens matter for what I'm writing now?\", scores all of them, and mixes their vectors. There is **no causal mask** on this part: the whole input is already known, so every input token is fair game at every step.",
        "Shapes make it concrete. With T_dec output positions and T_enc input tokens, the weight grid is T_dec × T_enc (one row per output position, one column per input token), and the result is one d-wide vector per output position, the same shape as the decoder's own vectors, so it can be added back with a residual connection.",
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
    },
    {
      heading: "Training and generating",
      paragraphs: [
        "Training uses pairs: an input and its target output (an English sentence and its French translation; an article and its summary). The encoder reads the input; the decoder is fed the correct output shifted one position right (**teacher forcing**), predicts every next output token in parallel, and the loss is cross-entropy over the target tokens. T5 pre-trains this way on a huge amount of text with a self-made task: hide spans of the input and have the decoder write them out.",
        "Generating is the familiar loop. Encode the input once. Then start the decoder with a start token; at each step run the decoder (self-attention over what it has written, cross-attention over the memory), choose a token, append it, and repeat until an end token. Encoding once and reusing the memory is what makes encoder-decoders efficient for long inputs with short outputs, such as summarisation.",
      ],
    },
    {
      heading: "What it costs to run",
      paragraphs: [
        "The encoder runs once per input. Its self-attention compares every input token with every other, so its cost grows with the square of the input length (T_in²). The decoder runs once per output token. At each step its self-attention compares the new token with the outputs written so far, and its cross-attention compares it with all T_in input vectors. The keys and values of the encoder memory are computed once and reused at every step.",
        "So an encoder-decoder pays for the long input once and then generates cheaply against it. That fits tasks such as summarising a long article into a few sentences, or translating sentence by sentence. When the output is long and open-ended (an essay, a conversation), the separate input stack buys less, which is another reason chat models are decoder-only.",
      ],
    },
    {
      heading: "How decoder-only models do the same job",
      paragraphs: [
        "A decoder-only model has no separate encoder and no cross-attention. It translates by putting everything in one sequence: `Translate to French: the cat sleeps ⇒` and then continuing. The input tokens sit earlier in the same context, so ordinary causal self-attention can look back at them, playing the role cross-attention plays in an encoder-decoder.",
        "The cost is that the input is read with a causal mask (each input token sees only what came before it) and is reprocessed as part of the growing sequence. The benefit is one simple architecture for every task, trained on raw text. At large scale that simplicity won, which is why most of today's LLMs are decoder-only, while encoder-decoder models remain common in translation systems and as efficient task-specific models.",
      ],
    },
    {
      heading: "Seeing it in practice",
      paragraphs: [
        "T5 frames every task as text to text: the input starts with a task prefix such as `translate English to German:` or `summarize:` and the decoder writes the answer. Running the small 60-million-parameter T5 locally (the \"Run it locally\" listing below) shows the whole design in a few lines of code: the tokenizer, the encoder reading once, and the decoder generating with cross-attention.",
      ],
    },
  ],
  guided:
    "Predict first: when the decoder writes the last French word, which English word should get the most attention? Step through the translation below and watch which input word each output word lines up with.",
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
  local: [],
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
