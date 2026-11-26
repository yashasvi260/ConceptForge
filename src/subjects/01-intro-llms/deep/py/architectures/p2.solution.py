def masked_softmax(scores, mask):
    """Softmax of each row using only the allowed positions; disallowed positions get exactly 0."""
    s = np.where(mask, scores, -np.inf)
    z = np.exp(s - s.max(axis=1, keepdims=True))
    return z / z.sum(axis=1, keepdims=True)

scores = np.array([[0.5, 2.0, 1.0], [0.0, 0.6, 3.0], [0.1, 0.2, 0.3]])
print(np.round(masked_softmax(scores, causal_mask(3)), 3) if masked_softmax(scores, causal_mask(3)) is not None else None)
