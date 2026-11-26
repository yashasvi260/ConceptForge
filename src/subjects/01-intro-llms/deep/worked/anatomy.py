# Worked example for "Anatomy of an LLM": one pass through a tiny, untrained model, every number shown.
# Vocabulary of 6 tokens, vectors of width 4, one attention step (no learned Q/K/V matrices, to keep it readable).
import json
import numpy as np

vocab = ["the", "cat", "sat", "on", "mat", "."]
E = np.array([
    [1.0, 0.0, 0.0, 0.0],   # the
    [0.0, 1.0, 0.5, 0.0],   # cat
    [0.0, 0.0, 1.0, 0.5],   # sat
    [0.5, 0.0, 0.0, 1.0],   # on
    [0.0, 0.9, 0.4, 0.1],   # mat
    [0.2, 0.2, 0.2, 0.2],   # .
])
ids = [0, 1, 2]              # "the cat sat"
X = E[ids]                   # embedding lookup: one row per token

d = X.shape[1]
S = X @ X.T / np.sqrt(d)     # how much each token "matches" each other token
mask = np.triu(np.ones((3, 3)), k=1).astype(bool)
S_masked = np.where(mask, -np.inf, S)   # a token may not look at later tokens
W = np.exp(S_masked - S_masked.max(axis=1, keepdims=True))
W = W / W.sum(axis=1, keepdims=True)    # softmax per row
M = W @ X                    # each token's new vector: a weighted mix of the vectors it may see

logits = M[-1] @ E.T         # score every vocabulary token against the last position's vector
p = np.exp(logits - logits.max())
p = p / p.sum()

r = lambda a: [round(float(v), 3) for v in a]
words = ["the", "cat", "sat"]
fmt = lambda v: "-inf" if v == -np.inf else round(float(v), 3)
print(json.dumps({
    "Step 1 · Embedding lookup (rows of the table)": [[w, i, *r(E[i])] for w, i in zip(words, ids)],
    "Step 2 · Attention scores, masked (row looks at column)": [[w, *[fmt(v) for v in row]] for w, row in zip(words, S_masked)],
    "Step 3 · Attention weights after softmax (each row adds up to 1)": [[w, *r(row)] for w, row in zip(words, W)],
    "Step 4 · Mixed vectors (weights × vectors)": [[w, *r(row)] for w, row in zip(words, M)],
    "Step 5 · Next-token probabilities after “the cat sat”": [[v, round(float(l), 3), round(float(q), 3)] for v, l, q in zip(vocab, logits, p)],
}))
