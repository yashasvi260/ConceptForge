import numpy as np

def causal_attention(Q, K, V):
    n, dh = Q.shape
    S = Q @ K.T / np.sqrt(dh)
    S[np.triu(np.ones((n, n), dtype=bool), k=1)] = -np.inf
    W = np.exp(S - S.max(axis=1, keepdims=True))
    return (W / W.sum(axis=1, keepdims=True)) @ V

def gqa_attention(Q, K, V):
    """Q: (heads, n, d_head); K, V: (kv_heads, n, d_head). Each query head attends with its group's K and V."""
    n_rep = Q.shape[0] // K.shape[0]
    K, V = repeat_kv(K, n_rep), repeat_kv(V, n_rep)
    return np.stack([causal_attention(Q[h], K[h], V[h]) for h in range(Q.shape[0])])

rng = np.random.default_rng(0)
Q = rng.normal(size=(8, 4, 16))
K, V = rng.normal(size=(2, 4, 16)), rng.normal(size=(2, 4, 16))
print(gqa_attention(Q, K, V).shape)
