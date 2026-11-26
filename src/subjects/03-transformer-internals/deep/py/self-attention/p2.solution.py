import numpy as np

def previous_token_score(W):
    """Average weight a head puts on the token just before each query (queries 1 … n−1)."""
    W = np.asarray(W)
    n = len(W)
    return float(np.mean([W[i, i - 1] for i in range(1, n)]))

def best_previous_head(attn):
    """(layer, head) of the head with the highest previous_token_score. attn: (layers, heads, n, n)."""
    attn = np.asarray(attn)
    scores = [(previous_token_score(attn[l, h]), l, h) for l in range(attn.shape[0]) for h in range(attn.shape[1])]
    _, l, h = max(scores)
    return (l, h)

print(best_previous_head(ATTN), round(previous_token_score(ATTN[4, 11]), 4))
