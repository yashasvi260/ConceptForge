import numpy as np
r = np.random.default_rng(21)
X2 = r.normal(size=(6, 24))
W = [r.normal(size=(24, 24)) * 0.2 for _ in range(4)]

def reference(X, Wq, Wk, Wv, Wo, H):
    dh = X.shape[1] // H
    outs = []
    for h in range(H):
        cols = slice(h * dh, (h + 1) * dh)
        q, k, v = (X @ Wq)[:, cols], (X @ Wk)[:, cols], (X @ Wv)[:, cols]
        s = q @ k.T / np.sqrt(dh) + np.triu(np.full((len(X), len(X)), -np.inf), k=1)
        w = np.exp(s - s.max(axis=1, keepdims=True))
        outs.append((w / w.sum(axis=1, keepdims=True)) @ v)
    return np.concatenate(outs, axis=1) @ Wo


def check_matches_a_head_by_head_reference(ns):
    for H in [1, 3, 8]:
        assert np.allclose(ns["multi_head"](X2, *W, H), reference(X2, *W, H)), f"H = {H}: must equal attending in each slice of columns separately, concatenating, then × Wo"

def check_heads_change_the_result(ns):
    assert not np.allclose(ns["multi_head"](X2, *W, 1), ns["multi_head"](X2, *W, 8)), "1 head and 8 heads use the same matrices but give different outputs: each head has its own softmax"
