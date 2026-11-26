import numpy as np

E = np.array([[1.0, 0, 0, 0], [0, 1, 0.5, 0], [0, 0, 1, 0.5], [0.5, 0, 0, 1], [0, 0.9, 0.4, 0.1], [0.2, 0.2, 0.2, 0.2]])

def check_matches_the_worked_example(ns):
    w, m = ns["causal_attention"](E[[0, 1, 2]])
    assert w is not None and m is not None, "return (weights, mixed)"
    assert np.allclose(np.round(w, 3), [[1, 0, 0], [0.349, 0.651, 0], [0.241, 0.309, 0.45]]), f"weights should match the worked example, got\n{np.round(w, 3)}"
    assert np.allclose(np.round(m[2], 3), [0.241, 0.309, 0.605, 0.225]), f"mixed vector for 'sat' should be [0.241, 0.309, 0.605, 0.225], got {np.round(m[2], 3)}"

def check_no_token_looks_ahead(ns):
    X = np.random.default_rng(0).normal(size=(5, 8))
    w, _ = ns["causal_attention"](X)
    assert np.allclose(np.triu(w, k=1), 0), "weights above the diagonal must be 0 (no peeking at later tokens)"
    assert np.allclose(w.sum(axis=1), 1), "each row of weights must add up to 1"

def check_shapes(ns):
    X = np.ones((7, 3))
    w, m = ns["causal_attention"](X)
    assert w.shape == (7, 7) and m.shape == (7, 3), f"expected (7, 7) and (7, 3), got {w.shape} and {m.shape}"
