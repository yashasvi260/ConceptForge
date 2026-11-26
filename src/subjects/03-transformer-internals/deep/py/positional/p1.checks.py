import numpy as np

def check_position_zero(ns):
    v = np.asarray(ns["sinusoidal"](0, 16))
    assert np.allclose(v, [0, 1] * 8), "at position 0 every sine is 0 and every cosine is 1"

def check_known_values(ns):
    v = np.asarray(ns["sinusoidal"](1, 16))
    assert np.allclose(v[:4], [0.8415, 0.5403, 0.3110, 0.9504], atol=1e-3), f"position 1 starts sin(1), cos(1), sin(1/10000^(2/16)), …; got {np.round(v[:4], 4)}"

def check_every_position_differs(ns):
    vs = np.array([ns["sinusoidal"](p, 16) for p in range(64)])
    assert len({tuple(np.round(r, 6)) for r in vs}) == 64, "each of the first 64 positions must get its own vector"
