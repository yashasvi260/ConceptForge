import numpy as np

def embed(E, ids):
    """Embedding lookup: return the rows of E for these token ids, shape (len(ids), d)."""
    # TODO: one line with NumPy indexing.
    return None

def softmax(x):
    """Softmax over the last axis: exponentiate, then divide by the sum. Each row must add up to 1."""
    # TODO: subtract the max first (x - x.max(axis=-1, keepdims=True)) so exp() never overflows.
    return None

E = np.array([[1.0, 0, 0, 0], [0, 1, 0.5, 0], [0, 0, 1, 0.5], [0.5, 0, 0, 1], [0, 0.9, 0.4, 0.1], [0.2, 0.2, 0.2, 0.2]])
X = embed(E, [0, 1, 2])
print("X shape:", None if X is None else X.shape)
print(softmax(np.array([1.0, 2.0, 3.0])))
