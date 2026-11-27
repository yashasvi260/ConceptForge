import numpy as np

def check_even_routing(ns):
    got = ns["switch_balance_loss"](np.full((8, 4), 0.25), np.array([0, 1, 2, 3, 0, 1, 2, 3]), 4)
    assert np.isclose(got, 1.0), f"perfectly even routing gives exactly 1.0, got {got}"

def check_collapse_is_penalised(ns):
    probs = np.tile([0.7, 0.1, 0.1, 0.1], (8, 1))
    got = ns["switch_balance_loss"](probs, np.zeros(8, dtype=int), 4)
    assert np.isclose(got, 2.8), f"every token sent to expert 0 with probability 0.7: 4 × (1 × 0.7) = 2.8, got {got}"
    assert got > ns["switch_balance_loss"](np.full((8, 4), 0.25), np.array([0, 1, 2, 3, 0, 1, 2, 3]), 4), "collapsing onto one expert must cost more than even routing"
