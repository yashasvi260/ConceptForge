import numpy as np
r = np.random.default_rng(9)
Q = r.normal(size=(8, 5, 16))
K, V = r.normal(size=(2, 5, 16)), r.normal(size=(2, 5, 16))

def one_head(q, k, v):
    n = len(q)
    s = q @ k.T / 4.0 + np.triu(np.full((n, n), -np.inf), k=1)
    w = np.exp(s - s.max(axis=1, keepdims=True))
    return (w / w.sum(axis=1, keepdims=True)) @ v

def check_groups_share_keys_and_values(ns):
    out = ns["gqa_attention"](Q, K, V)
    assert np.shape(out) == (8, 5, 16), "one output per query head"
    for h in range(8):
        assert np.allclose(out[h], one_head(Q[h], K[h // 4], V[h // 4])), f"query head {h} must use KV head {h // 4}"

def check_mha_is_the_special_case(ns):
    K8, V8 = r.normal(size=(8, 5, 16)), r.normal(size=(8, 5, 16))
    out = ns["gqa_attention"](Q, K8, V8)
    assert all(np.allclose(out[h], one_head(Q[h], K8[h], V8[h])) for h in range(8)), "with as many KV heads as query heads, GQA is ordinary multi-head attention"
