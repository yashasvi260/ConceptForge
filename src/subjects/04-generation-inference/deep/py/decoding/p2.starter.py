import numpy as np

def sample(p, rng):
    """Draw one index with probability p[i]: pick u uniformly in [0, 1) and find where it falls in the running total."""
    # TODO: u = rng.random(); return the first index whose cumulative probability exceeds u
    return int(np.argmax(p))

rng = np.random.default_rng(0)
print([sample([0.5, 0.3, 0.2], rng) for _ in range(10)])
