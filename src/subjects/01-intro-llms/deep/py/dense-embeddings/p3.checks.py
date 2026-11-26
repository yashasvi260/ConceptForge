def check_finds_dog_bites_man_and_man_bites_dog(ns):
    score, a, b = ns["most_similar_pair"]()
    assert {a, b} == {"Dog bites man", "Man bites dog"}, f"the closest pair is the two dog/man sentences (0.906), got {a!r} and {b!r}"
    assert round(score, 3) == 0.906, f"expected 0.906, got {round(score, 3)}"
