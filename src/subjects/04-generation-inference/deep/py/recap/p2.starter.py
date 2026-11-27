import numpy as np

def sample_next(z, rng, temperature=1.0, top_k=0, top_p=1.0, min_p=0.0):
    """Pick the next token id. temperature = 0 means greedy; otherwise draw from final_distribution."""
    # TODO
    return 0

france = DATA["gen"]["dists"][0]
z = [t["logit"] for t in france["top"]]
rng = np.random.default_rng(0)
print([france["top"][sample_next(z, rng, 0.8, 40, 0.9)]["token"] for _ in range(8)])
