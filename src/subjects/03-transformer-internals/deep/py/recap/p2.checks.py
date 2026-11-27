import numpy as np
r = np.random.default_rng(77)
V, C, d, H = 40, 12, 16, 2
WTE, WPE = r.normal(0, 0.3, size=(V, d)), r.normal(0, 0.3, size=(C, d))

def check_stack(ns):
    blocks = [ns["make_weights"](d, H, np.random.default_rng(s)) for s in range(3)]
    out = ns["gpt2_forward"]([1, 7, 3, 3], WTE, WPE, blocks, np.ones(d), np.zeros(d), H)
    assert np.shape(out) == (4, d), "one d-wide vector per token comes out"
    x = WTE[[1, 7, 3, 3]] + WPE[:4]
    for w in blocks:
        x = ns["gpt2_block"](x, w, H)
    x = (x - x.mean(-1, keepdims=True)) / np.sqrt(x.var(-1, keepdims=True) + 1e-5)
    assert np.allclose(out, x), "embed + positions, then every block in order, then the final LayerNorm"

def check_causal_prefix(ns):
    blocks = [ns["make_weights"](d, H, np.random.default_rng(s + 10)) for s in range(2)]
    short = ns["gpt2_forward"]([5, 2, 9], WTE, WPE, blocks, np.ones(d), np.zeros(d), H)
    longer = ns["gpt2_forward"]([5, 2, 9, 30, 11], WTE, WPE, blocks, np.ones(d), np.zeros(d), H)
    assert np.allclose(short, longer[:3]), "with the causal mask, adding tokens at the end can't change the outputs for earlier tokens"
