import numpy as np

def causal_mask(T):
    """T × T booleans: True where row i may look at column j (only j <= i). Decoders (GPT, Llama)."""
    # TODO: np.tril of a T × T matrix of ones, as bool
    return None

def bidirectional_mask(T):
    """T × T booleans: every token may look at every token. Encoders (BERT)."""
    # TODO
    return None

print(causal_mask(4).astype(int) if causal_mask(4) is not None else None)
