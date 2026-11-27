import numpy as np
R = DATA["gpt2"]["residual_norms"]
TOKENS, NORMS = R["tokens"], np.array(R["norms"])   # real GPT-2: NORMS[k][i] = length of token i's vector at stage k
# stage 0 = token + position vectors, stages 1–11 = after blocks 1–11, stage 12 = after block 12 and the final LayerNorm

def biggest_growth(norms):
    """(token index, ratio): the token whose vector grows the most from stage 0 to stage 11, and by what factor."""
    # TODO
    return (0, 1.0)

def final_norm_shrink(norms, i):
    """By what factor the final LayerNorm (stage 11 → 12) shrinks token i's vector."""
    # TODO
    return 1.0

i, ratio = biggest_growth(NORMS)
print(repr(TOKENS[i]), round(ratio, 1), round(final_norm_shrink(NORMS, i), 1))
