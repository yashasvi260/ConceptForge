def forward(E, ids, W1, W2):
    """A one-block model: embed → (+ attention) → (+ feed-forward) → logits vs. every vocab row → softmax.
    Return the probabilities for the token after the last position, shape (V,)."""
    X = embed(E, ids)
    _, mixed = causal_attention(X)
    X = X + mixed
    X = X + np.maximum(0, X @ W1) @ W2
    logits = X[-1] @ E.T
    return softmax(logits)

rng = np.random.default_rng(1)
W1, W2 = rng.normal(size=(4, 16)) * 0.5, rng.normal(size=(16, 4)) * 0.5
p = forward(E, [0, 1, 2], W1, W2)
print(None if p is None else (p.shape, round(float(p.sum()), 6)))
