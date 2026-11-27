import numpy as np
r = np.random.default_rng(42)
X = r.normal(size=(7, 24))

def reference_block(x, w, H):
    """An independent version: loops over heads and tokens, no reshapes."""
    n, d = x.shape
    dh = d // H
    def ln(v, g, b):
        return (v - v.mean(-1, keepdims=True)) / np.sqrt(v.var(-1, keepdims=True) + 1e-5) * g + b
    g = lambda v: 0.5 * v * (1 + np.tanh(np.sqrt(2 / np.pi) * (v + 0.044715 * v ** 3)))
    qkv = ln(x, w["ln1_g"], w["ln1_b"]) @ w["attn_w"] + w["attn_b"]
    Q, K, V = qkv[:, :d], qkv[:, d:2 * d], qkv[:, 2 * d:]
    heads = []
    for h in range(H):
        c = slice(h * dh, (h + 1) * dh)
        out = np.zeros((n, dh))
        for i in range(n):
            sc = np.array([Q[i, c] @ K[j, c] for j in range(i + 1)]) / np.sqrt(dh)
            p = np.exp(sc - sc.max()); p /= p.sum()
            out[i] = sum(p[j] * V[j, c] for j in range(i + 1))
        heads.append(out)
    x = x + np.concatenate(heads, axis=1) @ w["proj_w"] + w["proj_b"]
    return x + g(ln(x, w["ln2_g"], w["ln2_b"]) @ w["fc_w"] + w["fc_b"]) @ w["out_w"] + w["out_b"]

def check_matches_an_independent_reference(ns):
    w = ns["make_weights"](24, 3, np.random.default_rng(5))
    got = ns["gpt2_block"](X, w, 3)
    assert np.shape(got) == (7, 24), "a block returns the shape it receives"
    assert np.allclose(got, reference_block(X, w, 3)), "your block must match a slow head-by-head, token-by-token reference"

def check_residual_identity(ns):
    w = ns["make_weights"](24, 3, np.random.default_rng(6))
    for key in ["proj_w", "proj_b", "out_w", "out_b"]:
        w[key] = np.zeros_like(w[key])
    assert np.allclose(ns["gpt2_block"](X, w, 3), X), "if both sub-layers' output projections are zero, a pre-norm block passes x through unchanged"
