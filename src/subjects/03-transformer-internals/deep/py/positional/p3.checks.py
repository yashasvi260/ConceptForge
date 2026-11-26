import numpy as np
X = np.random.default_rng(5).normal(size=(5, 16))
perm = [3, 1, 4, 0, 2]

def check_attention_alone_is_order_blind(ns):
    assert ns["order_blind"](X, perm) is True, "without positions, shuffling the tokens just shuffles the outputs"

def check_positions_break_the_symmetry(ns):
    P = np.array([ns["sinusoidal"](p, 16) for p in range(5)])
    shuffled_then_placed = ns["attend"](ns["with_positions"](X[perm], P))
    placed_then_shuffled = ns["attend"](ns["with_positions"](X, P))[perm]
    assert not np.allclose(shuffled_then_placed, placed_then_shuffled), "with position vectors added, word order must change the result"
