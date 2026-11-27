import numpy as np

def check_same_as_full(ns):
    X = np.random.default_rng(5).normal(size=(7, ns["d"]))
    cache = {"K": [], "V": []}
    outs = np.stack([ns["attend_step"](x, cache) for x in X])
    full = ns["attend_all"](X)
    assert np.allclose(outs, full, atol=1e-10), f"step by step with a cache must equal full causal attention (max diff {np.abs(outs - full).max():.2e})"

def check_cache_grows(ns):
    cache = {"K": [], "V": []}
    for i, x in enumerate(np.random.default_rng(6).normal(size=(4, ns["d"]))):
        ns["attend_step"](x, cache)
        assert len(cache["K"]) == len(cache["V"]) == i + 1, "each step appends exactly one key and one value"

def check_first_token(ns):
    x = np.random.default_rng(7).normal(size=ns["d"])
    out = ns["attend_step"](x, {"K": [], "V": []})
    assert np.allclose(out, x @ ns["Wv"]), "the first token can only attend to itself: its output is its own value"
