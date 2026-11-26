def causal_attention(X):
    """One attention step without learned matrices.
    scores = X @ X.T / sqrt(d); hide later positions with -inf; softmax each row; mix the vectors.
    Return (weights, mixed): shapes (T, T) and (T, d)."""
    T, d = X.shape
    scores = X @ X.T / np.sqrt(d)
    mask = np.triu(np.ones((T, T)), k=1).astype(bool)
    scores = np.where(mask, -np.inf, scores)
    weights = softmax(scores)
    mixed = weights @ X
    return weights, mixed

weights, mixed = causal_attention(X)
print(weights)
