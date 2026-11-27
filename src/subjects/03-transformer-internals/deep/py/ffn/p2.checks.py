import numpy as np
r = np.random.default_rng(31)
X = r.normal(size=(6, 8))
W1, b1, W2, b2 = r.normal(size=(8, 32)), r.normal(size=32), r.normal(size=(32, 8)), r.normal(size=8)
Wg, Wu, Wd = r.normal(size=(8, 24)), r.normal(size=(8, 24)), r.normal(size=(24, 8))
g = lambda x: 0.5 * x * (1 + np.tanh(np.sqrt(2 / np.pi) * (x + 0.044715 * x ** 3)))
s = lambda x: x / (1 + np.exp(-x))

def check_gelu_ffn(ns):
    assert np.allclose(ns["ffn_gelu"](X, W1, b1, W2, b2), g(X @ W1 + b1) @ W2 + b2), "GELU(X W1 + b1) W2 + b2"

def check_swiglu_ffn(ns):
    assert np.allclose(ns["ffn_swiglu"](X, Wg, Wu, Wd), (s(X @ Wg) * (X @ Wu)) @ Wd), "the SiLU-gated half multiplies the other half, element by element, before W_down"

def check_each_token_on_its_own(ns):
    full = ns["ffn_gelu"](X, W1, b1, W2, b2)
    alone = np.vstack([ns["ffn_gelu"](X[i:i + 1], W1, b1, W2, b2) for i in range(len(X))])
    assert np.allclose(full, alone), "the feed-forward network treats every token separately: same result one at a time"
