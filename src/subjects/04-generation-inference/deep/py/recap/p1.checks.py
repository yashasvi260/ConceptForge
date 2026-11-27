import numpy as np
france = DATA["gen"]["dists"][0]
z = np.array([t["logit"] for t in france["top"]])

def check_ollama_defaults(ns):
    p = ns["final_distribution"](z, temperature=0.8, top_k=40, top_p=0.9)
    assert abs(p.sum() - 1) < 1e-9, "the final distribution sums to 1"
    assert int((p > 0).sum()) == 18, f"at T 0.8, top-k 40, top-p 0.9 (Ollama's defaults), 18 of GPT-2's top 40 survive; got {int((p > 0).sum())}"
    assert abs(p.max() - 0.2404) < 1e-3, f"and ' the' is drawn 24.0% of the time; got {p.max():.4f}"

def check_each_rule(ns):
    f = ns["final_distribution"]
    assert (f(z, top_k=3) > 0).sum() == 3, "top-k 3 keeps 3"
    assert (f(z, min_p=0.5) > 0).sum() == (np.exp(z - z.max()) >= 0.5).sum(), "min-p 0.5 keeps tokens with at least half the top token's probability"
    assert np.allclose(f([2.0, 1.0, 0.0]), np.exp([2, 1, 0]) / np.exp([2, 1, 0]).sum()), "with every rule off, it's plain softmax"

def check_order(ns):
    p = ns["final_distribution"]([2.0, 1.0, 0.0], temperature=2.0, top_p=0.6)
    assert (p > 0).sum() == 2, "temperature first: at T = 2 top-p 0.6 keeps two tokens"
