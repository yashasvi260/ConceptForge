import numpy as np
B = DATA["bank"]
N = list(B)

def matrix(ns):
    return ns["similarity_matrix"](np.array([B[n] for n in N]))

def check_river_sentences_pair_up(ns):
    M = matrix(ns)
    got = (ns["nearest_other"](M, 2), ns["nearest_other"](M, 3))
    assert got == (3, 2), f"the two river sentences are each other's nearest: (3, 2), got {got}"

def check_separation_is_only_partial(ns):
    M = matrix(ns)
    got = ns["nearest_other"](M, 0)
    assert got == 2, f"honest result: 'The bank approved the loan' is nearest to 'The river bank flooded' (0.826 > 0.806), got {got}"

def check_same_sense_is_closer_on_average(ns):
    same, diff = ns["within_and_across"](matrix(ns), ["money", "money", "river", "river"])
    assert abs(same - 0.854) < 1e-3 and abs(diff - 0.780) < 1e-3, f"same sense 0.854 vs different 0.780, got {same:.3f}, {diff:.3f}"
