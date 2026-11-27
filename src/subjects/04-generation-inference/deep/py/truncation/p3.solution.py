import numpy as np
D = DATA["gen"]["dists"]

def min_p_mask(p, min_p):
    """True for tokens whose probability is at least min_p times the top token's probability."""
    p = np.asarray(p, dtype=float)
    return p >= min_p * p.max()

def sample_chain(z, rng, temperature=1.0, top_k=0, top_p=1.0, min_p=0.0):
    """Hugging Face's order: temperature, then top-k, then top-p, then min-p (each on what's left), then draw."""
    z = np.asarray(z, dtype=float) / temperature
    if top_k:
        z = top_k_filter(z, top_k)
    p = softmax(z)
    if top_p < 1.0:
        p = np.where(top_p_mask(p, top_p), p, 0.0); p /= p.sum()
    if min_p > 0.0:
        p = np.where(min_p_mask(p, min_p), p, 0.0); p /= p.sum()
    return int(np.searchsorted(np.cumsum(p), rng.random(), side="right"))

print(sample_chain([3.0, 2.0, 1.0, 0.0], np.random.default_rng(0), top_k=2))
