import numpy as np

def scores(Q, K):
    """Scaled dot-product scores: S[i, j] = q_i · k_j / √d_head, for all pairs at once."""
    # TODO: one matrix product, then divide
    return np.zeros((len(Q), len(K)))

def softmax_rows(S):
    """Softmax of each row (subtract the row's max first, so exp never overflows)."""
    # TODO
    return S

S = scores(Q, K)
print(np.round(softmax_rows(S)[0], 3), softmax_rows(S).sum(axis=1))
