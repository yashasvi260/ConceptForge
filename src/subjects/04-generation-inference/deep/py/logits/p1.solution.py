import numpy as np
lm = DATA["gen"]["lm_head"]
h = np.array(lm["h"])                              # GPT-2's final vector after "The capital of France is" (768 numbers)
E = np.array([r["e"] for r in lm["rows"]])         # 12 rows of the token-embedding table (GPT-2 ties it to the LM head)
names = [r["token"] for r in lm["rows"]]

def logits_from(h, E):
    """One score per vocabulary row: the dot product of the final vector with that row."""
    return E @ h

def top_tokens(logits, names, k):
    """The k names with the highest logits, highest first."""
    order = np.argsort(-np.asarray(logits))[:k]
    return [names[i] for i in order]

print(top_tokens(logits_from(h, E), names, 5))
