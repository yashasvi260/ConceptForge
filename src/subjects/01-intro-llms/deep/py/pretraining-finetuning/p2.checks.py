def check_more_epochs_drown_out_general_knowledge(ns):
    cat = [ns["probs"](ns["fine_tune"](ns["base"], ns["banking"], e), "the").get("cat", 0) for e in (1, 5, 20)]
    assert cat[0] > cat[1] > cat[2], f"P(cat | the) should keep falling with more epochs, got {[round(c, 3) for c in cat]}"
    assert round(cat[2], 3) == 0.03, f"after 20 epochs P(cat | the) = 2/66 ≈ 0.030, got {round(cat[2], 3)}"
