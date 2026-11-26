def check_same_meaning_is_closer(ns):
    s, d = ns["same_vs_different"]()
    assert round(s, 3) == 0.854, f"same-meaning average should be (0.806 + 0.902) / 2 = 0.854, got {round(s, 3)}"
    assert round(d, 3) == 0.78, f"different-meaning average of the 4 cross pairs should be 0.780, got {round(d, 3)}"
    assert s > d, "same-meaning 'bank' vectors should be closer on average"
