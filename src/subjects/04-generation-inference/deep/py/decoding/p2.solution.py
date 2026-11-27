import numpy as np

def sample(p, rng):
    """Draw one index with probability p[i]: pick u uniformly in [0, 1) and find where it falls in the running total."""
    u = rng.random()
    return int(np.searchsorted(np.cumsum(p), u, side="right"))

rng = np.random.default_rng(0)
print([sample([0.5, 0.3, 0.2], rng) for _ in range(10)])
