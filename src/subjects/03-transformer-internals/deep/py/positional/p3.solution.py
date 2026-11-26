import numpy as np

def attend(X):
    """Self-attention with no learned weights and no positions: softmax(X Xᵀ / √d) X."""
    X = np.asarray(X, dtype=float)
    S = X @ X.T / np.sqrt(X.shape[1])
    W = np.exp(S - S.max(axis=1, keepdims=True))
    return (W / W.sum(axis=1, keepdims=True)) @ X

def order_blind(X, perm):
    """True if shuffling the tokens only shuffles the outputs: attend(X[perm]) == attend(X)[perm]."""
    X = np.asarray(X, dtype=float)
    return bool(np.allclose(attend(X[perm]), attend(X)[perm]))

def with_positions(X, pos_vectors):
    """Add one position vector to each token before attention."""
    return np.asarray(X, dtype=float) + np.asarray(pos_vectors, dtype=float)[: len(X)]

X = np.random.default_rng(0).normal(size=(4, 8))
print(order_blind(X, [2, 0, 3, 1]))
