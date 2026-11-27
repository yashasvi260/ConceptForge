import numpy as np
D = DATA["gen"]["dists"]

def check_real_nucleus(ns):
    for d in D:
        probs = [t["prob"] for t in d["top"]]
        got = int(ns["top_p_mask"](probs, 0.5).sum())
        want = d["nucleus"]["0.5"]
        assert got == want, f"{d['prompt']!r}: GPT-2's 0.5 nucleus (over all 50,257 tokens) has {want} tokens, got {got}"

def check_smallest_set(ns):
    m = ns["top_p_mask"]([0.1, 0.6, 0.3], 0.8)
    assert m.tolist() == [False, True, True], "p = 0.8: 0.6 alone isn't enough, 0.6 + 0.3 is; the 0.1 token is cut"
    assert ns["top_p_mask"]([0.1, 0.6, 0.3], 0.5).tolist() == [False, True, False], "p = 0.5: the top token alone covers it"

def check_adapts(ns):
    flat = ns["top_p_mask"]([0.25] * 4, 0.9).sum()
    peaked = ns["top_p_mask"]([0.97, 0.01, 0.01, 0.01], 0.9).sum()
    assert flat == 4 and peaked == 1, "the same p keeps 4 tokens of a flat distribution and 1 of a peaked one"
