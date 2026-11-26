import numpy as np

def cross_attention(Q, H):
    """Decoder positions (rows of Q, shape T_dec × d) attend over ALL encoder outputs (rows of H, T_enc × d).
    No causal mask: the whole input sentence is already known. Return (weights T_dec × T_enc, output T_dec × d)."""
    d = Q.shape[1]
    # TODO 1: scores = Q @ H.T / sqrt(d)
    # TODO 2: softmax each row
    # TODO 3: output = weights @ H
    return None, None

H = np.array([[1.0, 0.0], [0.0, 1.0], [0.5, 0.5]])   # "the", "cat", "sleeps"
Q = np.array([[0.2, 1.0]])                            # the decoder, about to write "chat"
w, out = cross_attention(Q, H)
print(w, out)
