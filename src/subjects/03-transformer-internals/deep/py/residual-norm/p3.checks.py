import numpy as np
X = np.random.default_rng(6).normal(size=(3, 8)) * 4
W1, W2 = np.random.default_rng(7).normal(size=(2, 8, 8)) * 0.3

def ln(v):
    v = np.asarray(v, dtype=float)
    return (v - v.mean(axis=-1, keepdims=True)) / np.sqrt(v.var(axis=-1, keepdims=True) + 1e-5)

zero = lambda v: np.zeros_like(v)
f1 = lambda v: v @ W1
f2 = lambda v: np.tanh(v @ W2)

def check_residual_path_is_an_identity(ns):
    assert np.allclose(ns["pre_norm_block"](X, zero, zero, ln), X), "pre-norm: if both sub-layers output nothing, the block passes x through unchanged"
    assert not np.allclose(ns["post_norm_block"](X, zero, zero, ln), X), "post-norm normalises the stream itself, so even an empty block changes x"

def check_orders(ns):
    h = X + f1(ln(X))
    assert np.allclose(ns["pre_norm_block"](X, f1, f2, ln), h + f2(ln(h))), "pre-norm: x + attn(norm(x)), then + ffn(norm(·))"
    p = ln(X + f1(X))
    assert np.allclose(ns["post_norm_block"](X, f1, f2, ln), ln(p + f2(p))), "post-norm: norm(x + attn(x)), then norm(· + ffn(·))"
