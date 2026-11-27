import numpy as np
lm = DATA["gen"]["lm_head"]
h = np.array(lm["h"]); E = np.array([r["e"] for r in lm["rows"]]); names = [r["token"] for r in lm["rows"]]
recorded = np.array([r["logit"] for r in lm["rows"]])

def check_matches_gpt2(ns):
    got = np.asarray(ns["logits_from"](h, E), dtype=float)
    assert got.shape == (12,), f"one logit per row: shape (12,), got {got.shape}"
    assert np.allclose(got, recorded, atol=0.02), f"h · e should reproduce GPT-2's own logits ({recorded[0]:.2f} for ' the'), got {got[0]:.2f}"

def check_top_tokens(ns):
    top = ns["top_tokens"](ns["logits_from"](h, E), names, 5)
    assert list(top[:3]) == [" the", " now", " a"], f"GPT-2's top 3 are ' the', ' now', ' a'; got {list(top[:3])}"
    assert set(top) == {" the", " now", " a", " France", " Paris"}, f"' France' and ' Paris' complete the top 5 (only 0.004 apart, so rounding may swap them); got {top}"
    assert list(ns["top_tokens"]([1.0, 3.0, 2.0], ["a", "b", "c"], 2)) == ["b", "c"], "highest logit first"
