import numpy as np

def split_heads(X, H):
    """(n, d) → (H, n, d/H): head h gets columns h·d/H … (h+1)·d/H − 1 of every row."""
    X = np.asarray(X)
    n, d = X.shape
    return X.reshape(n, H, d // H).transpose(1, 0, 2)

def merge_heads(Z):
    """(H, n, d_head) → (n, H·d_head): the inverse of split_heads (concatenate the heads)."""
    Z = np.asarray(Z)
    H, n, dh = Z.shape
    return Z.transpose(1, 0, 2).reshape(n, H * dh)

X = np.arange(24.0).reshape(2, 12)
print(split_heads(X, 3).shape, np.array_equal(merge_heads(split_heads(X, 3)), X))
