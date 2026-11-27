import numpy as np

def repetition_penalty(logits, seen_ids, penalty):
    """Hugging Face's rule: for every token already in the sequence (prompt included), divide its logit by the
    penalty if it's positive and multiply it by the penalty if it's negative, so it always becomes less likely."""
    out = np.array(logits, dtype=float)
    # TODO
    return out

cat = DATA["gen"]["dists"][1]["top"]                     # "The cat sat on the": real logits, all negative
z = [t["logit"] for t in cat[:5]]
print(repetition_penalty(z, [0], 1.2))
