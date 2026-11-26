# Worked example for "Queries, keys and values": one query scored against three keys in a tiny made-up example
# (d = 4), and why scores are divided by √d, measured on random vectors.
import json
import numpy as np

tokens = ["the", "bank", "approved"]
X = np.array([[0.1, 0.2, -0.3, 0.9], [0.8, -0.5, 0.4, 0.1], [0.6, 0.7, 0.2, -0.4]])   # toy token vectors
Wq = np.array([[1, 0, 0.5, 0], [0, 1, 0, 0.5], [0.5, 0, 1, 0], [0, 0.5, 0, 1]])        # toy projections
Wk = np.array([[0.8, 0.2, 0, 0], [0.2, 0.8, 0, 0], [0, 0, 0.8, 0.2], [0, 0, 0.2, 0.8]])
Q, K = X @ Wq, X @ Wk
d = X.shape[1]
raw = Q[2] @ K.T                       # the query of "approved" against every key
scaled = raw / np.sqrt(d)
w = np.exp(scaled - scaled.max()); w /= w.sum()
one_query = [[t, round(float(r), 3), round(float(s), 3), round(float(x), 3)] for t, r, s, x in zip(tokens, raw, scaled, w)]

rng = np.random.default_rng(0)
def top_weight(S):
    e = np.exp(S - S.max(axis=1, keepdims=True))
    return float((e / e.sum(axis=1, keepdims=True)).max(axis=1).mean())
rows = []
for d in [4, 16, 64, 256]:
    q = rng.normal(size=(2000, 1, d))
    k = rng.normal(size=(2000, 8, d))
    S = (q * k).sum(axis=2)            # 2000 queries × 8 keys, components with variance 1
    rows.append([d, round(float(S.std()), 2), round(float((S / np.sqrt(d)).std()), 2), round(top_weight(S), 3), round(top_weight(S / np.sqrt(d)), 3)])
print(json.dumps({
    "One query against three keys (toy vectors, d = 4)": one_query,
    "Why divide by √d: random scores over 8 keys": rows,
}))
