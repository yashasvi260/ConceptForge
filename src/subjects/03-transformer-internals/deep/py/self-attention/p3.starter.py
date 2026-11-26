import numpy as np

def first_token_share(W):
    """Average weight a head puts on the very first token, over queries 1 … n−1 (query 0 can only see itself)."""
    # TODO
    return 0.0

def count_sinks(attn, threshold=0.5):
    """How many heads put more than `threshold` of their attention on the first token."""
    # TODO
    return 0

print(count_sinks(ATTN), "of", ATTN.shape[0] * ATTN.shape[1], "heads")
