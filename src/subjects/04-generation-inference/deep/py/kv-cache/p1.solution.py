import numpy as np
rng = np.random.default_rng(0)
d = 8
Wq, Wk, Wv = (rng.normal(size=(d, d)) for _ in range(3))     # made-up weights for one attention head

def attend_all(X):
    """Causal self-attention over every token at once (what the loop does WITHOUT a cache)."""
    Q, K, V = X @ Wq, X @ Wk, X @ Wv
    S = Q @ K.T / np.sqrt(d)
    S = np.where(np.tril(np.ones_like(S)) == 1, S, -np.inf)
    W = np.exp(S - S.max(axis=1, keepdims=True)); W /= W.sum(axis=1, keepdims=True)
    return W @ V

def attend_step(x_new, cache):
    """One decode step WITH a cache: project only the new token, append its key and value to the cache,
    and let its query attend to every cached key. Returns the new token's output vector."""
    q, k, v = x_new @ Wq, x_new @ Wk, x_new @ Wv
    cache["K"].append(k); cache["V"].append(v)
    K, V = np.stack(cache["K"]), np.stack(cache["V"])
    s = K @ q / np.sqrt(d)
    w = np.exp(s - s.max()); w /= w.sum()
    return w @ V

X = rng.normal(size=(5, d))
cache = {"K": [], "V": []}
outs = np.stack([attend_step(x, cache) for x in X])
print(np.abs(outs - attend_all(X)).max())
