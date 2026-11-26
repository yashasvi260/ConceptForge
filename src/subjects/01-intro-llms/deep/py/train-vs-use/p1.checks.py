import math

def check_matches_the_worked_example(ns):
    got = round(ns["cross_entropy"](0.179), 3)
    assert got == 1.72, f"-ln(0.179) ≈ 1.72, got {got}"

def check_perfect_confidence_costs_nothing(ns):
    assert abs(ns["cross_entropy"](1.0)) < 1e-12, "if the model gives the right token probability 1, the loss is 0"

def check_lower_probability_means_higher_loss(ns):
    f = ns["cross_entropy"]
    assert f(0.1) > f(0.5) > f(0.9), "the less probability on the right token, the bigger the loss"
