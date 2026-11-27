import numpy as np
D = DATA["gen"]["dists"]

def top_p_mask(p, top_p):
    """True for the smallest set of most likely tokens whose probabilities add up to at least top_p."""
    p = np.asarray(p, dtype=float)
    # TODO: sort from most to least likely, add up, and keep tokens until the running total reaches top_p
    return np.ones(len(p), dtype=bool)

for d in D:
    probs = [t["prob"] for t in d["top"]]          # full-vocabulary probabilities of the top 40
    print(d["prompt"], int(top_p_mask(probs, 0.5).sum()))
