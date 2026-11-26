import numpy as np
S0 = DATA["gpt2"]["sentences"][0]
ATTN = np.array(S0["attn"])        # GPT-2 small's real weights: (12 layers, 12 heads, 12 queries, 12 keys)

def causal_softmax(S):
    """Softmax of each row of an n × n score matrix, after hiding every future key (j > i) with −inf."""
    S = np.array(S, dtype=float)
    n = len(S)
    S[np.triu(np.ones((n, n), dtype=bool), k=1)] = -np.inf
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def is_causal(W):
    """True if no query gives any weight to a later key (everything above the diagonal is 0)."""
    return bool(np.all(np.triu(np.asarray(W), k=1) == 0))

print(np.round(causal_softmax(np.zeros((4, 4))), 3))
print(is_causal(ATTN[4, 11]))
