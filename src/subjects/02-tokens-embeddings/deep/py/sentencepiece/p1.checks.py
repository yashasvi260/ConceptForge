def check_spaces_become_word_markers(ns):
    got = ns["normalize"]("hello   world")
    assert got == "▁hello▁world", f"expected '▁hello▁world' (▁ is U+2581), got {got!r}"

def check_score_is_a_sum_of_log_probabilities(ns):
    got = ns["score"](["▁hello", "▁world"])
    assert abs(got - (-9.5699)) < 1e-3, f"log p(▁hello) + log p(▁world) ≈ -4.741 + -4.829 = -9.570, got {got}"

def check_fewer_likely_pieces_win(ns):
    cands = [["▁hell", "o", "▁world"], ["▁hello", "▁world"], ["▁he", "llo", "▁world"]]
    got = ns["pick_best"](cands)
    assert got == ["▁hello", "▁world"], f"the highest summed log-probability is ['▁hello', '▁world'], got {got}"
