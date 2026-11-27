import numpy as np

def split_heads(X, H):
    """(n, d) → (H, n, d/H): head h gets columns h·d/H … (h+1)·d/H − 1 of every row."""
    # TODO: reshape to (n, H, d/H), then move the head axis first with transpose(1, 0, 2)
    return np.zeros((H,) + np.shape(X))

def merge_heads(Z):
    """(H, n, d_head) → (n, H·d_head): the inverse of split_heads (concatenate the heads)."""
    # TODO
    return np.zeros((1, 1))

X = np.arange(24.0).reshape(2, 12)
print(split_heads(X, 3).shape, np.array_equal(merge_heads(split_heads(X, 3)), X))
