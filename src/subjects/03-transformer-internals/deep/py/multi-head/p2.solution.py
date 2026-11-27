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
    Q, K, V = (split_heads(X @ W, H) for W in (Wq, Wk, Wv))
    Z = np.stack([causal_attention(Q[h], K[h], V[h]) for h in range(H)])
    return merge_heads(Z) @ Wo

rng = np.random.default_rng(0)
X = rng.normal(size=(5, 16))
Wq, Wk, Wv, Wo = (rng.normal(size=(16, 16)) * 0.3 for _ in range(4))
print(multi_head(X, Wq, Wk, Wv, Wo, 4).shape)
