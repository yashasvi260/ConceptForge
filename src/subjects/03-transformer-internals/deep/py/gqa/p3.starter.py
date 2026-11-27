import numpy as np

def causal_attention(Q, K, V):
    n, dh = Q.shape
    S = Q @ K.T / np.sqrt(dh)
    S[np.triu(np.ones((n, n), dtype=bool), k=1)] = -np.inf
    W = np.exp(S - S.max(axis=1, keepdims=True))
    return (W / W.sum(axis=1, keepdims=True)) @ V

def gqa_attention(Q, K, V):
    """Q: (heads, n, d_head); K, V: (kv_heads, n, d_head). Each query head attends with its group's K and V."""
    # TODO: n_rep = heads // kv_heads; repeat K and V; run causal_attention for every head; np.stack
    return np.zeros_like(Q)

rng = np.random.default_rng(0)
Q = rng.normal(size=(8, 4, 16))
K, V = rng.normal(size=(2, 4, 16)), rng.normal(size=(2, 4, 16))
print(gqa_attention(Q, K, V).shape)
