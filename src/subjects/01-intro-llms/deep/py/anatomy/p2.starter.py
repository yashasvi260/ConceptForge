def causal_attention(X):
    """One attention step without learned matrices.
    scores = X @ X.T / sqrt(d); hide later positions with -inf; softmax each row; mix the vectors.
    Return (weights, mixed): shapes (T, T) and (T, d)."""
    T, d = X.shape
    # TODO 1: scores
    # TODO 2: mask = np.triu(np.ones((T, T)), k=1).astype(bool); scores = np.where(mask, -np.inf, scores)
    # TODO 3: weights = softmax(scores); mixed = weights @ X
    return None, None

weights, mixed = causal_attention(X)
print(weights)
