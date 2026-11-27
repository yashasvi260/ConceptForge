import numpy as np
rows = DATA["gen"]["positions"]["rows"]   # every position of a real sentence: the probability GPT-2 gave the real next token

def entropy_bits(p):
    """How spread out a distribution is, in bits: -sum p · log2 p (zero-probability entries add nothing)."""
    # TODO
    return 0.0

def mean_loss(p_actual):
    """The average of -ln p over the real next tokens: the language-modelling loss."""
    # TODO
    return 0.0

def perplexity(p_actual):
    """e to the mean loss: 'as unsure as choosing among this many tokens'."""
    # TODO
    return 0.0

p = [r["p_actual"] for r in rows]
print(round(mean_loss(p), 3), round(perplexity(p), 1))
