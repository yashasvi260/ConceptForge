import numpy as np
r = np.random.default_rng(11)
Q2, K2 = r.normal(size=(3, 64)), r.normal(size=(4, 64))

def check_scaled_scores(ns):
    S = ns["scores"](Q2, K2)
    assert np.shape(S) == (3, 4), "one score per (query, key) pair: 3 × 4"
    assert np.allclose(S, Q2 @ K2.T / 8), "divide q·k by √64 = 8"

def check_softmax(ns):
    W = ns["softmax_rows"](np.array([[1.0, 2.0, 3.0], [1000.0, 1000.0, 0.0]]))
    assert np.allclose(W.sum(axis=1), 1), "each row of weights sums to 1"
    assert np.allclose(W[0], [0.0900, 0.2447, 0.6652], atol=1e-4), "softmax([1, 2, 3]) = [0.090, 0.245, 0.665]"
    assert np.allclose(W[1], [0.5, 0.5, 0], atol=1e-6), "large scores must not overflow: subtract the row max before exp"
