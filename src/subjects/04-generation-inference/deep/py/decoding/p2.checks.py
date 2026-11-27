import numpy as np
p = np.array([0.5, 0.3, 0.15, 0.05])

def check_frequencies(ns):
    rng = np.random.default_rng(1)
    draws = np.array([ns["sample"](p, rng) for _ in range(20000)])
    freq = np.bincount(draws, minlength=4) / len(draws)
    assert np.allclose(freq, p, atol=0.012), f"over 20,000 draws, frequencies match the probabilities {p.tolist()}; got {freq.round(3).tolist()}"

def check_zero_never_drawn(ns):
    rng = np.random.default_rng(2)
    assert all(ns["sample"]([0.0, 0.7, 0.0, 0.3], rng) in (1, 3) for _ in range(2000)), "a token with probability 0 is never drawn"

def check_seeded(ns):
    a = [ns["sample"](p, r) for r in [np.random.default_rng(7)] for _ in range(50)]
    b = [ns["sample"](p, r) for r in [np.random.default_rng(7)] for _ in range(50)]
    assert a == b, "the same seed gives the same draws"
