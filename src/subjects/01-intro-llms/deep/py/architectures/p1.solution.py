import numpy as np

def causal_mask(T):
    """T × T booleans: True where row i may look at column j (only j <= i). Decoders (GPT, Llama)."""
    return np.tril(np.ones((T, T))).astype(bool)

def bidirectional_mask(T):
    """T × T booleans: every token may look at every token. Encoders (BERT)."""
    return np.ones((T, T), dtype=bool)

print(causal_mask(4).astype(int) if causal_mask(4) is not None else None)
