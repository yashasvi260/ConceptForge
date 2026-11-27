import numpy as np

def check_shape(ns):
    m = ns["sliding_window_mask"](6, 3)
    assert m.shape == (6, 6) and m.dtype == bool, "an n × n boolean mask"
    assert m[5].tolist() == [False, False, False, True, True, True], "token 5 with a window of 3 sees tokens 3, 4 and 5"
    assert not m[2, 3], "still causal: no token sees the future"

def check_wide_window_is_causal(ns):
    assert np.array_equal(ns["sliding_window_mask"](8, 100), np.tril(np.ones((8, 8), dtype=bool))), "a window at least n wide is ordinary causal attention"

def check_work_is_linear(ns):
    counts = [ns["sliding_window_mask"](n, 4).sum() for n in (100, 200)]
    assert counts == [4 * 100 - 6, 4 * 200 - 6], f"with window 4, each query compares with at most 4 keys: 394 and 794 products, got {counts}"
