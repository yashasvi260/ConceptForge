import numpy as np
X = np.arange(2 * 768, dtype=float).reshape(2, 768)

def check_gpt2_split(ns):
    Z = ns["split_heads"](X, 12)
    assert np.shape(Z) == (12, 2, 64), f"GPT-2 small: 12 heads × 2 tokens × 64 numbers, got {np.shape(Z)}"
    assert np.array_equal(Z[1, 0], X[0, 64:128]), "head 1 gets columns 64–127 of each token"

def check_merge_inverts_split(ns):
    assert np.array_equal(ns["merge_heads"](ns["split_heads"](X, 12)), X), "merging the heads must give back exactly the original matrix"
