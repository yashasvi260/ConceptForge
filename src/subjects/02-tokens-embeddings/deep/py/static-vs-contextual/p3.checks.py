import numpy as np
P = DATA["pool"]["The bank approved the loan"]
X = np.array(P["vectors"])

def check_same_word_differs_in_context(ns):
    got = ns["repeated_word_similarity"](X, 1, 4)
    assert abs(got - 0.907) < 1e-3, f"the two 'the's share a table row (1.0) but not a contextual vector: 0.907, got {got}"

def check_bank_has_absorbed_loan(ns):
    got = ns["closest_word"](X, P["tokens"], 2)
    assert got == "loan", f"after attention, 'bank' is closest to 'loan' (0.61), got {got!r}"
