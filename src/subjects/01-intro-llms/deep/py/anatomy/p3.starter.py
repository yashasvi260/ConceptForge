def forward(E, ids, W1, W2):
    """A one-block model: embed → (+ attention) → (+ feed-forward) → logits vs. every vocab row → softmax.
    Return the probabilities for the token after the last position, shape (V,)."""
    X = embed(E, ids)
    # TODO 1: residual attention:   X = X + mixed, where mixed comes from causal_attention(X)
    # TODO 2: residual feed-forward: X = X + np.maximum(0, X @ W1) @ W2
    # TODO 3: logits = X[-1] @ E.T   (compare the last vector with every token's embedding)
    # TODO 4: return softmax(logits)
    return None

rng = np.random.default_rng(1)
W1, W2 = rng.normal(size=(4, 16)) * 0.5, rng.normal(size=(16, 4)) * 0.5
p = forward(E, [0, 1, 2], W1, W2)
print(None if p is None else (p.shape, round(float(p.sum()), 6)))
