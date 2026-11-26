import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const lookupTable: DeepLesson = {
  why: [
    "The tokenizer's job ends with a list of IDs. The model's job starts by turning each ID into something it can compute with: a vector, a list of a few hundred or a few thousand numbers. The bridge between the two is the **embedding table**, a matrix with one row per vocabulary entry. Turning token 2,924 into a vector means reading row 2,924. That is the whole operation, and it is the first thing every transformer does.",
    "The table is not designed; it is learned. Its numbers start random, and training nudges each row so that the model's predictions improve. Over billions of examples, tokens that are used in similar ways end up with similar rows, which is where the idea of \"meaning as a direction in space\" comes from. The table is also big: in small models it can be a third of all parameters (step 2), and it has to be stored, loaded and updated like any other weight.",
    "This step makes the lookup concrete with MiniLM's real token IDs, shows that a lookup is the same thing as multiplying a one-hot vector by the table (which is how the maths of training treats it), measures the table's memory for real models, and shows how training updates only the rows of tokens that actually appear, which is why rare tokens stay poorly trained.",
  ],
  worked: [
    {
      kind: "text",
      text: "Every model's table has one row per vocabulary entry and one column per vector dimension (`d_model`). MiniLM's width, 384, is read from its real output vectors; the other models come from their published configurations. Memory is the number of entries times 4 bytes (float32) or 2 bytes (float16):",
    },
    {
      kind: "table",
      caption: "Embedding table sizes",
      columns: ["model", "rows (vocabulary)", "columns (d_model)", "numbers", "MB in float32", "MB in float16"],
      rows: [
        ["MiniLM (all-MiniLM-L6-v2)", 30522, 384, 11720448, 46.9, 23.4],
        ["GPT-2 small", 50257, 768, 38597376, 154.4, 77.2],
        ["Llama 3 8B", 128256, 4096, 525336576, 2101.3, 1050.7],
        ["GPT-3 175B", 50257, 12288, 617558016, 2470.2, 1235.1],
      ],
      source: "worked/lookup-table.py",
    },
    {
      kind: "text",
      text: "MiniLM reads `The bank approved the loan` as IDs `[101, 1996, 2924, 4844, 1996, 5414, 102]` (`[CLS]`, the, bank, approved, the, loan, `[SEP]`). The lookup returns rows 101, 1996, 2924, … of the table: a 7 × 384 array. Both `the`s get row 1,996, the same vector, because the table knows nothing about position or context. Mathematically, a lookup is a one-hot vector (all zeros except a 1 at the token's ID) multiplied by the table. With a toy 4 × 3 table:",
    },
    {
      kind: "table",
      caption: "A lookup is a one-hot row times the table",
      columns: ["token ID", "one-hot row", "one-hot × table", "row of the table"],
      rows: [
        [2, "[0, 0, 1, 0]", "[6.0, 7.0, 8.0]", "[6.0, 7.0, 8.0]"],
        [0, "[1, 0, 0, 0]", "[0.0, 1.0, 2.0]", "[0.0, 1.0, 2.0]"],
        [2, "[0, 0, 1, 0]", "[6.0, 7.0, 8.0]", "[6.0, 7.0, 8.0]"],
      ],
      source: "worked/lookup-table.py",
    },
  ],
  concept: [
    {
      heading: "The table and the lookup",
      paragraphs: [
        "An embedding table E has V rows (the vocabulary size) and d columns (the model's width, `d_model`). For a sequence of token IDs, the lookup stacks the corresponding rows into an array of shape (sequence length × d). Nothing is computed; numbers are copied. In PyTorch this is `nn.Embedding(V, d)`, and calling it with a tensor of IDs returns their rows.",
        "Writing the lookup as a product with a one-hot vector is how the maths is usually presented, and it explains why the table can be trained like any other weight matrix: one-hot(id) × E is an ordinary matrix product, so gradients flow through it. Nobody computes it that way, though. The product would do V × d multiply-adds to fetch d numbers, 30,522 times more work than reading the row for MiniLM, so real implementations index directly.",
        "With a batch the shapes stack up: a batch of B sequences, each padded to n tokens (step 8), becomes a B × n array of IDs, and the lookup turns it into a B × n × d array of numbers. That three-dimensional shape, batch by position by feature, is what flows through every layer of a transformer, and you will see it in every model's code from here on.",
        "The rows the lookup returns are **static**: the same token always gets the same vector, wherever it appears. Position information is added next, and the transformer blocks then mix each vector with its neighbours to make it **contextual** (step 12, and Module 03).",
      ],
      formula: {
        expr: "x_i = E[id_i] = one_hot(id_i) · E          X = E[ids]  (shape: n × d)",
        symbols: [
          { sym: "E", meaning: "the embedding table, V × d (MiniLM: 30,522 × 384)" },
          { sym: "id_i", meaning: "the i-th token's ID from the tokenizer" },
          { sym: "one_hot(id)", meaning: "a length-V vector of zeros with a single 1 at position id" },
        ],
        example: "`bank` is ID 2,924 in MiniLM, so its starting vector is row 2,924: 384 numbers.",
      },
      mistake: "Thinking the embedding table already encodes context. Both `the`s in the sentence get the identical row 1,996; any difference between them is created later by attention.",
    },
    {
      heading: "How the table learns",
      paragraphs: [
        "The table starts as small random numbers. During training the model makes a prediction, the loss measures how wrong it was, and backpropagation (Module 05) computes how each number should change. For the embedding table that gradient has a special shape: only the rows that were looked up receive any gradient. A row's gradient is the gradient that arrived at its position, and a token that appears several times in the batch receives the sum over its positions.",
        "Two consequences follow. First, updates are **sparse**: a batch touches a few thousand rows out of tens of thousands, and libraries can exploit this (PyTorch's `nn.Embedding` has a `sparse` option). Second, a token's row only improves as often as the token appears. Frequent tokens are refined billions of times; a token that almost never appears keeps something close to its random starting point, which is the mechanism behind the glitch tokens of step 10.",
        "In NumPy the accumulation needs care: `G[ids] += g` silently keeps only one of the updates when an ID repeats, while `np.add.at(G, ids, g)` adds them all. Part 3 uses the second.",
      ],
      formula: {
        expr: "∂L/∂E[v] = Σ_{i : id_i = v} ∂L/∂x_i          (zero for every v not in the batch)",
        symbols: [
          { sym: "∂L/∂x_i", meaning: "the gradient of the loss with respect to position i's vector" },
          { sym: "Σ over i with id_i = v", meaning: "all positions where token v appears" },
        ],
        example: "`the` appears at positions 1 and 4, so row 1,996's gradient is the sum of those two positions' gradients.",
      },
    },
    {
      heading: "What the rows end up meaning",
      paragraphs: [
        "Nothing tells the model what any row should mean. Rows become useful because tokens that play similar roles in the training text receive similar gradients and drift toward similar values. That is why, in a trained table, ` cat` and ` dog` end up closer than ` cat` and ` tax`. Before transformers, methods such as word2vec (2013) trained exactly this kind of table on its own, with a small objective (predict the neighbouring words), and showed that directions in the space can line up with relations like plural forms or countries and capitals.",
        "In a transformer the table is trained together with everything else, so its rows are shaped by what the later layers need, not by a separate objective. Some models also reuse the same table at the output (tied embeddings, step 2), where the final vector is compared with every row to score the next token, so the rows must serve both as inputs and as targets.",
      ],
    },
    {
      heading: "Memory and precision",
      paragraphs: [
        "The table is stored like any other weight. MiniLM's 11.7 million numbers take 46.9 MB in float32 and half that in float16; Llama 3 8B's table alone is about 1 GB in float16, twice that counting its separate output head. When you load a model on a laptop or GPU, the table is part of what must fit in memory, and quantization (Module 16) shrinks it the same way as the other weights.",
        "Only the rows for the current tokens are needed for the forward pass, but the whole table must be available, because any token can appear next. That is one reason very large vocabularies are expensive to serve, not just to train.",
      ],
    },
  ],
  guided:
    "Type a sentence and follow each word piece to its row number in the table. Predict which rows two copies of the same word will use, then check. Try a long, rare word and count how many rows it needs.",
  build: {
    id: "m02-lookup-table",
    title: "Look up, measure and train an embedding table",
    packages: ["numpy"],
    data: "minilm",
    parts: [
      part("lookup-table", "p1", "Look up MiniLM's real token IDs in an embedding table, and show the one-hot product gives the same rows.", [
        "`E[ids]` with a list of IDs returns the stacked rows.",
        "Build only the rows you need: `one_hot = np.zeros((len(ids), E.shape[0])); one_hot[np.arange(len(ids)), ids] = 1`, then `one_hot @ E`.",
      ]),
      part("lookup-table", "p2", "Measure the table's memory in float32 and float16, and how much work direct lookup saves over the matrix product.", [
        "`vocab * d * bytes_per_number`.",
        "The product does `vocab * d` multiply-adds to fetch `d` numbers: the ratio is the vocabulary size.",
      ]),
      part("lookup-table", "p3", "Compute the table's gradient for one sentence: only used rows change, and a repeated token's gradients add up.", [
        "`np.add.at(G, ids, grad_rows)` scatters and adds, including for repeated IDs.",
        "`G[ids] += grad_rows` looks equivalent but drops repeated updates; the checks will catch it.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m02-lookup-static",
      prompt: "In `The bank approved the loan`, the word `the` appears twice. What do the two copies get from the embedding table?",
      options: [
        "Different rows, because their positions differ",
        "The identical row (ID 1,996); context and position are added later",
        "No row, because `the` is a stop word",
        "An average of both positions",
      ],
      correctIndex: 1,
      explanation: "The table maps IDs to rows and knows nothing else. Position information and attention, applied afterwards, are what make the two copies different.",
    },
    {
      id: "m02-lookup-rare",
      prompt: "Why do rare tokens end up with poorly trained embedding rows?",
      options: [
        "Their rows are smaller",
        "A row only receives a gradient when its token appears in a batch, so rare tokens are updated rarely",
        "Rare tokens are frozen on purpose",
        "The optimizer skips rows with large IDs",
      ],
      correctIndex: 1,
      explanation: "Embedding gradients are sparse: rows not looked up get zero. A token seen a handful of times in training stays close to its random start.",
    },
  ],
  oneSentence:
    "The embedding table is a learned V × d matrix, and turning a token into a vector just reads its row (equivalent to a one-hot product); training updates only the rows of tokens that appear, so frequent tokens get well-trained vectors and rare ones do not.",
  deeper: [
    {
      label: "PyTorch nn.Embedding",
      url: "https://pytorch.org/docs/stable/generated/torch.nn.Embedding.html",
      adds: "The lookup layer every PyTorch model uses, including the `padding_idx` and `sparse` options.",
    },
    {
      label: "Mikolov et al. 2013, word2vec",
      url: "https://arxiv.org/abs/1301.3781",
      adds: "Training an embedding table on its own, and the famous vector arithmetic it made possible.",
    },
    {
      label: "Jay Alammar: The Illustrated Word2vec",
      url: "https://jalammar.github.io/illustrated-word2vec/",
      adds: "A visual walk through how embedding rows are trained from context windows.",
    },
  ],
};
