import numpy as np

def attention(Q, K, V):
    """softmax(Q Kᵀ / √d) V: each token's output is a weighted average of all the values."""
    # TODO: use scores and softmax_rows from part 2
    return np.zeros_like(V)

out = attention(Q, K, V)
print(out.shape)
