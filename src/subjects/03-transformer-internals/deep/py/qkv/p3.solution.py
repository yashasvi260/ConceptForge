import numpy as np

def attention(Q, K, V):
    """softmax(Q Kᵀ / √d) V: each token's output is a weighted average of all the values."""
    return softmax_rows(scores(Q, K)) @ V

out = attention(Q, K, V)
print(out.shape)
