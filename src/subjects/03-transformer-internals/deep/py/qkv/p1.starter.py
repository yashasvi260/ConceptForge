import numpy as np
rng = np.random.default_rng(0)
X = rng.normal(size=(5, 16))                   # 5 tokens, 16 numbers each (stand-ins)
Wq, Wk, Wv = (rng.normal(size=(16, 8)) for _ in range(3))   # one head of width 8

def project(X, Wq, Wk, Wv):
    """Every token's query, key and value: three matrix products, each (n × d_model) @ (d_model × d_head)."""
    # TODO
    return np.zeros((len(X), 8)), np.zeros((len(X), 8)), np.zeros((len(X), 8))

Q, K, V = project(X, Wq, Wk, Wv)
print(Q.shape, K.shape, V.shape)
