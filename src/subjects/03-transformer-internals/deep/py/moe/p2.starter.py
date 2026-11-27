import numpy as np

def route(scores, k):
    """Pick the k highest-scoring experts and turn their scores into weights that sum to 1
    (a softmax over just those k). Returns (expert indices, highest first; weights)."""
    # TODO: np.argsort(-scores)[:k], then softmax over scores[top]
    return np.arange(k), np.full(k, 1 / k)

def moe_layer(X, experts, W_router, k):
    """For each token (row of X): score the experts with x @ W_router, route to k of them, and return the
    weighted sum of the chosen experts' outputs. `experts` is a list of functions, one per expert."""
    # TODO
    return np.zeros_like(X)

scores = np.array([1.2, -0.3, 2.1, 0.4, -1.0, 1.9, 0.0, -0.5])
print(route(scores, 2))
