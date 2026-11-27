import numpy as np

def causal_attention(Q, K, V):
    """One head: causal softmax(QKᵀ/√d) V."""
    n, dh = Q.shape
    S = Q @ K.T / np.sqrt(dh)
    S[np.triu(np.ones((n, n), dtype=bool), k=1)] = -np.inf
    W = np.exp(S - S.max(axis=1, keepdims=True))
    return (W / W.sum(axis=1, keepdims=True)) @ V

def multi_head(X, Wq, Wk, Wv, Wo, H):
    """Project once (d × d matrices), split into H heads, attend in each head, merge, then mix with Wo."""
    # TODO: Q = split_heads(X @ Wq, H), same for K and V; run causal_attention per head; merge_heads; @ Wo
    return np.zeros_like(X)

rng = np.random.default_rng(0)
X = rng.normal(size=(5, 16))
Wq, Wk, Wv, Wo = (rng.normal(size=(16, 16)) * 0.3 for _ in range(4))
print(multi_head(X, Wq, Wk, Wv, Wo, 4).shape)
