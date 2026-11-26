def check_fine_tuning_teaches_loan(ns):
    p = ns["probs"](ns["tuned"], "the")
    assert round(p.get("loan", 0), 3) == 0.222, f"after fine-tuning P(loan | the) should be 2/9 = 0.222, got {p.get('loan')}"
    assert round(p.get("cat", 0), 3) == 0.222, f"P(cat | the) drops from 0.333 to 2/9 = 0.222, got {p.get('cat')}"

def check_base_model_is_untouched(ns):
    p = ns["probs"](ns["base"], "the")
    assert "loan" not in p and round(p["cat"], 3) == 0.333, "count(banking, base) must not change base itself"
