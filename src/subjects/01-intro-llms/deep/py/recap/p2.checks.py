def check_smoothed_probability(ns):
    counts = {"the": {"cat": 2, "dog": 1}}
    vocab = ["the", "cat", "dog", "fish"]
    got = ns["prob"](counts, vocab, "the", "cat")
    assert abs(got - 3 / 7) < 1e-12, f"(2 + 1) / (3 + 4) = 3/7, got {got}"

def check_unseen_pairs_are_not_zero(ns):
    got = ns["prob"]({"the": {"cat": 2}}, ["the", "cat", "loan"], "the", "loan")
    assert abs(got - 1 / 5) < 1e-12, f"(0 + 1) / (2 + 3) = 1/5, got {got}"
    got = ns["prob"]({}, ["a", "b"], "zzz", "a")
    assert abs(got - 1 / 2) < 1e-12, f"an unseen previous token gives a uniform 1/V; got {got}"

def check_probabilities_add_up_to_1(ns):
    c, v = ns["counts"], ns["vocab"]
    total = sum(ns["prob"](c, v, "the", w) for w in v)
    assert abs(total - 1) < 1e-9, f"over the whole vocabulary they should add up to 1, got {total}"
