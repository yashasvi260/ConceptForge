import numpy as np

def _reference(E, ids, W1, W2):
    X = E[ids]
    T, d = X.shape
    s = X @ X.T / np.sqrt(d)
    s = np.where(np.triu(np.ones((T, T)), k=1).astype(bool), -np.inf, s)
    w = np.exp(s - s.max(axis=1, keepdims=True)); w /= w.sum(axis=1, keepdims=True)
    X = X + w @ X
    X = X + np.maximum(0, X @ W1) @ W2
    z = X[-1] @ E.T
    p = np.exp(z - z.max())
    return p / p.sum()

def check_returns_one_probability_per_vocab_token(ns):
    rng = np.random.default_rng(7)
    E, W1, W2 = rng.normal(size=(9, 6)), rng.normal(size=(6, 12)), rng.normal(size=(12, 6))
    p = ns["forward"](E, [3, 1, 4, 1], W1, W2)
    assert p is not None, "forward returned None"
    assert np.shape(p) == (9,), f"one probability per vocabulary token: shape (9,), got {np.shape(p)}"
    assert abs(float(np.sum(p)) - 1) < 1e-9, "probabilities must add up to 1"

def check_matches_the_reference_model(ns):
    rng = np.random.default_rng(7)
    E, W1, W2 = rng.normal(size=(9, 6)), rng.normal(size=(6, 12)), rng.normal(size=(12, 6))
    p = ns["forward"](E, [3, 1, 4, 1], W1, W2)
    assert np.allclose(p, _reference(E, [3, 1, 4, 1], W1, W2)), "values differ: check the two residual additions (X = X + …) and the ReLU"
