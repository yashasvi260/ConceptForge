import numpy as np
rng0 = np.random.default_rng(1)
V, d = 12, 16                                      # a made-up model (random weights): 12-token vocabulary, one layer
E = rng0.normal(size=(V, d)); P = rng0.normal(size=(32, d)) * 0.5
Wq, Wk, Wv = (rng0.normal(size=(d, d)) / np.sqrt(d) for _ in range(3))
Wo = rng0.normal(size=(d, V))                      # output matrix: one column per vocabulary entry

def forward(new_ids, start, cache):
    """Run new tokens (at positions start, start + 1, …), append their keys and values to cache, return their logits."""
    X = E[new_ids] + P[start:start + len(new_ids)]
    cache["K"].extend(X @ Wk); cache["V"].extend(X @ Wv)
    K, Vv = np.array(cache["K"]), np.array(cache["V"])
    n, T = len(new_ids), len(cache["K"])
    S = np.where(np.arange(T)[None, :] <= (T - n + np.arange(n))[:, None], (X @ Wq) @ K.T / np.sqrt(d), -np.inf)
    A = np.exp(S - S.max(1, keepdims=True)); A /= A.sum(1, keepdims=True)
    return (X + A @ Vv) @ Wo

def generate(prompt, n_new, use_cache, pick):
    """The loop. With the cache, step 0 feeds the prompt and later steps feed only the newest token; without it,
    every step feeds everything into a fresh cache. Returns (new token ids, total tokens fed)."""
    ids, fed = list(prompt), 0
    # TODO
    return ids[len(prompt):], fed

print(generate([3, 1, 4], 8, True, lambda z: int(np.argmax(z))))
