import numpy as np
rows = DATA["gen"]["positions"]["rows"]
p = [r["p_actual"] for r in rows]

def check_entropy(ns):
    assert abs(ns["entropy_bits"]([0.25] * 4) - 2) < 1e-9, "four equally likely tokens: 2 bits"
    assert abs(ns["entropy_bits"]([1.0, 0.0, 0.0])) < 1e-9, "a certain prediction: 0 bits (and 0 · log 0 counts as 0)"
    assert ns["entropy_bits"]([0.5, 0.5]) > ns["entropy_bits"]([0.9, 0.1]), "a flatter distribution has more entropy"

def check_real_loss(ns):
    m = ns["mean_loss"](p)
    assert abs(m - DATA["gen"]["positions"]["mean_loss"]) < 1e-3, f"GPT-2's mean loss on this sentence is {DATA['gen']['positions']['mean_loss']}, got {m:.3f}"
    pp = ns["perplexity"](p)
    assert abs(pp - 68.29) < 0.05, f"perplexity e^4.224 ≈ 68.3, got {pp:.2f}"
    assert abs(ns["perplexity"]([0.25, 0.25]) - 4) < 1e-9, "always giving the right token 1/4: perplexity 4"
