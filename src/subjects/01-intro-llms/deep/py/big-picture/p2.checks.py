def check_p_cat_after_the_is_one_third(ns):
    p = ns["next_token_probs"](ns["counts"], "the")
    assert abs(p.get("cat", 0) - 2 / 6) < 1e-9, f"P(cat | the) should be 2/6 ≈ 0.333, got {p.get('cat')}"

def check_probabilities_add_up_to_1(ns):
    for prev in ns["counts"]:
        total = sum(ns["next_token_probs"](ns["counts"], prev).values())
        assert abs(total - 1) < 1e-9, f"probabilities after {prev!r} add up to {total}, not 1"
