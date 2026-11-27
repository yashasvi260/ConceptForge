import numpy as np
france = DATA["gen"]["dists"][0]                          # "The capital of France is": GPT-2's real top 40 logits
z = np.array([t["logit"] for t in france["top"]])

def final_distribution(z, temperature=1.0, top_k=0, top_p=1.0, min_p=0.0):
    """The probability of drawing each token after the whole chain, in Hugging Face's order:
    divide by temperature → keep top-k → softmax → keep the top-p nucleus → keep min-p → renormalise."""
    z = np.asarray(z, dtype=float) / temperature
    order = np.argsort(-z)
    keep = np.zeros(len(z), dtype=bool)
    keep[order[: top_k or len(z)]] = True
    p = np.where(keep, np.exp(z - z.max()), 0.0); p /= p.sum()
    if top_p < 1.0:
        cum = np.cumsum(p[order])
        n = int(np.searchsorted(cum, top_p - 1e-12)) + 1
        keep[:] = False; keep[order[:n]] = True
        p = np.where(keep, p, 0.0); p /= p.sum()
    if min_p > 0.0:
        p = np.where(p >= min_p * p.max(), p, 0.0); p /= p.sum()
    return p

p = final_distribution(z, temperature=0.8, top_k=40, top_p=0.9)
print(int((p > 0).sum()), "tokens survive; top token", round(p.max(), 3))
