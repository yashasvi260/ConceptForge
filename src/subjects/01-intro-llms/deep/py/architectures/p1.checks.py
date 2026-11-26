import numpy as np

def check_causal_mask_matches_the_worked_example(ns):
    m = ns["causal_mask"](4)
    assert m is not None, "causal_mask returned None"
    assert np.array_equal(np.asarray(m).astype(int), [[1, 0, 0, 0], [1, 1, 0, 0], [1, 1, 1, 0], [1, 1, 1, 1]]), f"got\n{np.asarray(m).astype(int)}"

def check_bidirectional_mask_is_all_true(ns):
    m = ns["bidirectional_mask"](3)
    assert m is not None and np.asarray(m).shape == (3, 3) and np.asarray(m).all(), "every entry should be True"
