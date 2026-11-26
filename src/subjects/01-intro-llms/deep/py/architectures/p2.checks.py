import numpy as np

S = np.array([[0.5, 2.0, 1.0], [0.0, 0.6, 3.0], [0.1, 0.2, 0.3]])

def check_first_token_only_sees_itself(ns):
    w = ns["masked_softmax"](S, ns["causal_mask"](3))
    assert w is not None, "masked_softmax returned None"
    assert np.allclose(w[0], [1, 0, 0]), f"row 0 may only look at position 0, so it must be [1, 0, 0]; got {np.round(w[0], 3)}"

def check_future_is_ignored(ns):
    w = ns["masked_softmax"](S, ns["causal_mask"](3))
    assert np.allclose(np.round(w[1], 3), [0.354, 0.646, 0]), f"row 1 ignores the big score 3.0 at position 2: expected [0.354, 0.646, 0], got {np.round(w[1], 3)}"
    assert np.allclose(w.sum(axis=1), 1), "rows must add up to 1"

def check_bidirectional_uses_everything(ns):
    w = ns["masked_softmax"](S, np.ones((3, 3), dtype=bool))
    assert w[1, 2] > 0.8, "with no mask, row 1 puts most weight on its biggest score (3.0)"
