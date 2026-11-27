import numpy as np

def route(scores, k):
    """Pick the k highest-scoring experts and turn their scores into weights that sum to 1
    (a softmax over just those k). Returns (expert indices, highest first; weights)."""
    scores = np.asarray(scores, dtype=float)
    top = np.argsort(-scores)[:k]
    e = np.exp(scores[top] - scores[top].max())
    return top, e / e.sum()

def moe_layer(X, experts, W_router, k):
    """For each token (row of X): score the experts with x @ W_router, route to k of them, and return the
    weighted sum of the chosen experts' outputs. `experts` is a list of functions, one per expert."""
    out = np.zeros_like(X, dtype=float)
    for i, x in enumerate(X):
        top, w = route(x @ W_router, k)
        out[i] = sum(wj * experts[j](x) for j, wj in zip(top, w))
    return out

scores = np.array([1.2, -0.3, 2.1, 0.4, -1.0, 1.9, 0.0, -0.5])
print(route(scores, 2))
