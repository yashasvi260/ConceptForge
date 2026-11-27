import numpy as np
D = DATA["gen"]["dists"]

def top_p_mask(p, top_p):
    """True for the smallest set of most likely tokens whose probabilities add up to at least top_p."""
    p = np.asarray(p, dtype=float)
    order = np.argsort(-p)
    cum = np.cumsum(p[order])
    n = int(np.searchsorted(cum, top_p - 1e-12)) + 1     # first position where the total reaches top_p
    mask = np.zeros(len(p), dtype=bool)
    mask[order[:n]] = True
    return mask

for d in D:
    probs = [t["prob"] for t in d["top"]]          # full-vocabulary probabilities of the top 40
    print(d["prompt"], int(top_p_mask(probs, 0.5).sum()))
