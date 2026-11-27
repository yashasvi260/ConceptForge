import numpy as np
greedy = lambda z: int(np.argmax(z))

def check_same_tokens(ns):
    a, fa = ns["generate"]([3, 1, 4], 12, True, greedy)
    b, fb = ns["generate"]([3, 1, 4], 12, False, greedy)
    assert len(a) == 12 and a == b, f"greedy with and without the cache must give the same 12 tokens; got {a} and {b}"
    assert len(set(a)) > 4, f"this made-up model doesn't just repeat one token; got {a}"
    assert (fa, fb) == (3 + 12 - 1, sum(3 + t for t in range(12))), f"tokens fed: P + G - 1 = 14 with the cache, 102 without; got {fa}, {fb}"

def check_same_samples(ns):
    pick = lambda r: (lambda z: ns["sample_next"](z, r, temperature=1.0, top_p=0.9))
    a, _ = ns["generate"]([5, 2], 10, True, pick(np.random.default_rng(3)))
    b, _ = ns["generate"]([5, 2], 10, False, pick(np.random.default_rng(3)))
    assert a == b, "with the same seed, the cached loop samples exactly the same tokens"

def check_logits_match(ns):
    c = {"K": [], "V": []}
    ns["forward"]([3, 1, 4], 0, c)
    step = ns["forward"]([7], 3, c)[-1]
    full = ns["forward"]([3, 1, 4, 7], 0, {"K": [], "V": []})[-1]
    assert np.allclose(step, full, atol=1e-12), "one cached step equals rerunning the whole sequence"
