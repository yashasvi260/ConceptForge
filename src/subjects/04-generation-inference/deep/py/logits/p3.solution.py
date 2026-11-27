import numpy as np
rows = DATA["gen"]["positions"]["rows"]   # every position of a real sentence: the probability GPT-2 gave the real next token

def entropy_bits(p):
    """How spread out a distribution is, in bits: -sum p · log2 p (zero-probability entries add nothing)."""
    p = np.asarray(p, dtype=float)
    p = p[p > 0]
    return float(-(p * np.log2(p)).sum())

def mean_loss(p_actual):
    """The average of -ln p over the real next tokens: the language-modelling loss."""
    return float(-np.mean(np.log(p_actual)))

def perplexity(p_actual):
    """e to the mean loss: 'as unsure as choosing among this many tokens'."""
    return float(np.exp(mean_loss(p_actual)))

p = [r["p_actual"] for r in rows]
print(round(mean_loss(p), 3), round(perplexity(p), 1))
