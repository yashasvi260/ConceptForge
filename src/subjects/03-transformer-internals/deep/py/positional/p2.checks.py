import numpy as np
rng = np.random.default_rng(3)
q, k = rng.normal(size=8), rng.normal(size=8)

def check_rotation_keeps_length(ns):
    for p in [0, 1, 17, 500]:
        assert np.isclose(np.linalg.norm(ns["rope"](q, p)), np.linalg.norm(q)), "a rotation never changes a vector's length"

def check_only_distance_matters(ns):
    r = ns["rope"]
    a, b, c = r(q, 9) @ r(k, 4), r(q, 305) @ r(k, 300), r(q, 5) @ r(k, 0)
    assert np.allclose([a, b], c), f"positions (9, 4), (305, 300) and (5, 0) are all 5 apart, so the scores must match: {a:.4f}, {b:.4f}, {c:.4f}"
    assert not np.isclose(r(q, 9) @ r(k, 4), r(q, 9) @ r(k, 1)), "a different distance should give a different score"

def check_matches_the_page(ns):
    q4, k4 = np.array([0.9, 0.2, -0.4, 0.7]), np.array([0.5, -0.8, 0.3, 0.6])
    assert np.isclose(ns["rope"](q4, 7) @ ns["rope"](k4, 2), 1.1457, atol=1e-4), "positions 7 and 2 give 1.1457 in the page's RoPE panel"
