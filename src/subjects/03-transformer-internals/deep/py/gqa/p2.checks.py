import numpy as np
K = np.random.default_rng(4).normal(size=(8, 5, 16))   # Llama 3 8B's layout: 8 KV heads

def check_llama_grouping(ns):
    R = ns["repeat_kv"](K, 4)
    assert np.shape(R) == (32, 5, 16), "8 KV heads × 4 = one K per query head, 32 in all"
    for h in [0, 3, 4, 17, 31]:
        assert np.array_equal(R[h], K[h // 4]), f"query head {h} must read KV head {h // 4}"

def check_no_repeat_is_identity(ns):
    assert np.array_equal(ns["repeat_kv"](K, 1), K), "with one query head per KV head (multi-head attention), nothing is repeated"
