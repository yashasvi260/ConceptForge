import numpy as np

def previous_token_score(W):
    """Average weight a head puts on the token just before each query (queries 1 … n−1)."""
    # TODO: the entries W[i, i - 1]
    return 0.0

def best_previous_head(attn):
    """(layer, head) of the head with the highest previous_token_score. attn: (layers, heads, n, n)."""
    # TODO
    return (0, 0)

print(best_previous_head(ATTN), round(previous_token_score(ATTN[4, 11]), 4))
