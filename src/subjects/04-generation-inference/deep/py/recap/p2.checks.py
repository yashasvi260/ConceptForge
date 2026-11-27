import numpy as np
france = DATA["gen"]["dists"][0]
z = np.array([t["logit"] for t in france["top"]])

def check_greedy(ns):
    assert ns["sample_next"]([0.1, 3.0, 2.0], np.random.default_rng(0), temperature=0) == 1, "temperature 0 is greedy"

def check_frequencies(ns):
    rng = np.random.default_rng(4)
    draws = np.bincount([ns["sample_next"](z, rng, 0.8, 40, 0.9) for _ in range(8000)], minlength=40) / 8000
    want = ns["final_distribution"](z, 0.8, 40, 0.9)
    assert np.all(draws[want == 0] == 0), "tokens the chain cut are never drawn"
    assert np.abs(draws - want).max() < 0.015, f"draw frequencies match the final distribution; worst gap {np.abs(draws - want).max():.3f}"

def check_seeded(ns):
    a = [ns["sample_next"](z, r, 1.0) for r in [np.random.default_rng(9)] for _ in range(30)]
    b = [ns["sample_next"](z, r, 1.0) for r in [np.random.default_rng(9)] for _ in range(30)]
    assert a == b and len(set(a)) > 3, "the same seed repeats the same draws, and sampling at T = 1 varies"
