import numpy as np
r = np.random.default_rng(7)
X2 = r.normal(size=(6, 12))
A, B, C = (r.normal(size=(12, 4)) for _ in range(3))

def check_shapes(ns):
    Q, K, V = ns["project"](X2, A, B, C)
    assert np.shape(Q) == np.shape(K) == np.shape(V) == (6, 4), "6 tokens, each with a 4-number query, key and value"

def check_each_role_uses_its_own_matrix(ns):
    Q, K, V = ns["project"](X2, A, B, C)
    assert np.allclose(Q, X2 @ A) and np.allclose(K, X2 @ B) and np.allclose(V, X2 @ C), "query = x·Wq, key = x·Wk, value = x·Wv, for every token at once"
