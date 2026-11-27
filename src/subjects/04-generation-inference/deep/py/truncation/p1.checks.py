import numpy as np
weekend = DATA["gen"]["dists"][3]
z = np.array([t["logit"] for t in weekend["top"]])
P = np.array([t["prob"] for t in weekend["top"]])

def check_keeps_k(ns):
    f = ns["top_k_filter"](z, 3)
    assert np.isfinite(f).sum() == 3 and np.all(np.isfinite(f[:3])), "k = 3 keeps exactly the three highest logits"
    p = ns["softmax"](f)
    want = P[:3] / P[:3].sum()
    assert np.allclose(p[:3], want, atol=2e-3) and np.all(p[3:] == 0), f"after top-3 the survivors are renormalised: {want.round(3).tolist()}"

def check_unsorted_input(ns):
    f = ns["top_k_filter"]([0.5, 3.0, -1.0, 2.0], 2)
    assert np.isfinite(f).tolist() == [False, True, False, True], "it picks the largest logits wherever they are, not the first k"

def check_k_one_is_greedy(ns):
    p = ns["softmax"](ns["top_k_filter"](z, 1))
    assert p[0] == 1.0, "k = 1 leaves only the top token: greedy decoding"
