import numpy as np
cat = DATA["gen"]["dists"][1]["top"]
z = np.array([t["logit"] for t in cat])

def check_signs(ns):
    got = ns["repetition_penalty"]([2.0, -2.0, 1.0], [0, 1], 2.0)
    assert np.allclose(got, [1.0, -4.0, 1.0]), f"positive 2 → 2 / 2 = 1, negative -2 → -2 × 2 = -4, unseen unchanged; got {got}"

def check_once_per_token(ns):
    got = ns["repetition_penalty"]([2.0, 1.0], [0, 0, 0], 2.0)
    assert np.allclose(got, [1.0, 1.0]), "a token seen three times is penalised once, not three times"

def check_real_logits(ns):
    got = ns["repetition_penalty"](z, [0], 1.2)
    assert abs(got[0] - z[0] * 1.2) < 1e-9, "GPT-2's logits are negative, so ' floor' (-80.65) is multiplied: -96.78"
    assert np.argmax(got) == 1, "after the penalty, ' bed' overtakes ' floor' as the greedy choice"
