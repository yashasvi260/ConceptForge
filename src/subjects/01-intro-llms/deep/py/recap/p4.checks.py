import math

def check_uniform_model_has_perplexity_V(ns):
    got = ns["perplexity"]({}, ["a", "b", "c", "d"], ["a", "b", "c"])
    assert abs(got - 4) < 1e-9, f"a model that knows nothing gives every token 1/4, so perplexity is 4; got {got}"

def check_fine_tuning_lowers_perplexity_on_banking_text(ns):
    b, a = ns["before"], ns["after"]
    assert a < b, f"after fine-tuning on banking text the held-out banking perplexity should drop; got {b:.2f} → {a:.2f}"
