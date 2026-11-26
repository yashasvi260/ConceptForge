import numpy as np
r = np.random.default_rng(13)
Q3, K3, V3 = r.normal(size=(4, 8)), r.normal(size=(4, 8)), r.normal(size=(4, 8))

def check_matches_the_formula(ns):
    S = Q3 @ K3.T / np.sqrt(8)
    W = np.exp(S - S.max(axis=1, keepdims=True))
    W /= W.sum(axis=1, keepdims=True)
    assert np.allclose(ns["attention"](Q3, K3, V3), W @ V3), "softmax(QKᵀ/√d) times V"

def check_a_dominant_key_copies_its_value(ns):
    K = np.zeros((3, 8)); K[1] = 100.0
    Q = np.ones((1, 8))
    V = np.arange(24, dtype=float).reshape(3, 8)
    assert np.allclose(ns["attention"](Q, K, V)[0], V[1], atol=1e-6), "when one key matches far better than the rest, the output is (almost exactly) its value"
