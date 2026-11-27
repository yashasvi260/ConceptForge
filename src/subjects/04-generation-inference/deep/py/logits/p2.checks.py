import numpy as np
top = DATA["gen"]["dists"][2]["top"]          # "Your loan application has been": logits around -130
z = np.array([t["logit"] for t in top])

def check_sums_to_one(ns):
    p = ns["softmax"](z)
    assert np.isfinite(p).all() and abs(p.sum() - 1) < 1e-9, "GPT-2's real logits (about -130) must give finite probabilities that sum to 1"
    assert np.allclose(ns["softmax"](z + 500), p), "adding the same number to every logit changes nothing"

def check_huge_logits(ns):
    with np.errstate(all="ignore"):
        p = ns["softmax"]([1000.0, 999.0])
    assert np.allclose(p, [0.7310586, 0.2689414]), f"softmax([1000, 999]) = [0.731, 0.269]; exp(1000) overflows unless you subtract the max (got {p})"

def check_log_softmax(ns):
    with np.errstate(all="ignore"):
        lp = ns["log_softmax"]([0.0, -1000.0])
    assert np.allclose(lp, [0.0, -1000.0]), f"log_softmax([0, -1000]) = [0, -1000]; log(softmax) gives -inf because exp(-1000) rounds to 0 (got {lp})"
    assert np.allclose(ns["log_softmax"](z), np.log(ns["softmax"](z))), "where nothing underflows, it equals log(softmax)"
