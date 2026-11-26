import numpy as np

def first_token_share(W):
    """Average weight a head puts on the very first token, over queries 1 … n−1 (query 0 can only see itself)."""
    W = np.asarray(W)
    return float(W[1:, 0].mean())

def count_sinks(attn, threshold=0.5):
    """How many heads put more than `threshold` of their attention on the first token."""
    attn = np.asarray(attn)
    return sum(first_token_share(attn[l, h]) > threshold for l in range(attn.shape[0]) for h in range(attn.shape[1]))

print(count_sinks(ATTN), "of", ATTN.shape[0] * ATTN.shape[1], "heads")
