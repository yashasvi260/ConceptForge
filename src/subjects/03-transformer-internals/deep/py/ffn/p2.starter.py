import numpy as np

def ffn_gelu(X, W1, b1, W2, b2):
    """GPT-2's feed-forward network: widen (X @ W1 + b1), GELU, narrow (@ W2 + b2)."""
    # TODO
    return np.zeros_like(X)

def ffn_swiglu(X, Wg, Wu, Wd):
    """Llama's feed-forward network: (silu(X @ Wg) * (X @ Wu)) @ Wd. No biases."""
    # TODO
    return np.zeros_like(X)

rng = np.random.default_rng(0)
X = rng.normal(size=(5, 16))
W1, W2 = rng.normal(size=(16, 64)) * 0.2, rng.normal(size=(64, 16)) * 0.2
print(ffn_gelu(X, W1, np.zeros(64), W2, np.zeros(16)).shape)
