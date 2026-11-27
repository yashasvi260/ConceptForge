import numpy as np

def pre_norm_block(x, attn, ffn, norm):
    """GPT-2 / Llama order: normalise, transform, add back.  x ← x + attn(norm(x)); x ← x + ffn(norm(x))."""
    # TODO
    return x

def post_norm_block(x, attn, ffn, norm):
    """The original Transformer's order: add, then normalise.  x ← norm(x + attn(x)); x ← norm(x + ffn(x))."""
    # TODO
    return x

norm = lambda v: layer_norm(v, 1, 0)
zero = lambda v: np.zeros_like(v)
x = np.array([[2.0, -1.0, 0.5, 8.0]])
print(pre_norm_block(x, zero, zero, norm), post_norm_block(x, zero, zero, norm))
