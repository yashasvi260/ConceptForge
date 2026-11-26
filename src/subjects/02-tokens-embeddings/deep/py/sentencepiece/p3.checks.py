TEXTS = ["hello world", "the cat sat on the mat", "unbelievable", "tokenization"]

def check_frequent_piece_costs_most(ns):
    got = ns["removal_loss"]("▁the", TEXTS)
    assert abs(got - 25.8807) < 1e-3, f"▁the is used twice; removing it loses 25.881, got {got}"

def check_rare_piece_costs_little(ns):
    got = ns["removal_loss"]("▁unbeliev", TEXTS)
    assert abs(got - 3.0367) < 1e-3, f"▁unbeliev is used once and has cheap substitutes: removing it loses only 3.037, got {got}"

def check_unused_piece_costs_nothing(ns):
    got = ns["removal_loss"]("ld", TEXTS)
    assert got == 0, f"no best split uses 'ld', so removing it costs 0, got {got}"
