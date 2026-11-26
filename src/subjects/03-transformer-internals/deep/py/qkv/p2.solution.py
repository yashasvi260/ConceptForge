import numpy as np

def scores(Q, K):
    """Scaled dot-product scores: S[i, j] = q_i · k_j / √d_head, for all pairs at once."""
    return Q @ K.T / np.sqrt(Q.shape[1])

def softmax_rows(S):
    """Softmax of each row (subtract the row's max first, so exp never overflows)."""
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

S = scores(Q, K)
print(np.round(softmax_rows(S)[0], 3), softmax_rows(S).sum(axis=1))
