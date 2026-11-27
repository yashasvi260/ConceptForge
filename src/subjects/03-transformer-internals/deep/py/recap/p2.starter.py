import numpy as np

def gpt2_forward(ids, wte, wpe, blocks, lnf_g, lnf_b, H):
    """The whole stack: token vectors + position vectors, every block in turn, then the final LayerNorm."""
    # TODO
    return np.zeros((len(ids), wte.shape[1]))

rng = np.random.default_rng(1)
V, C, d, H, L = 50, 16, 32, 4, 3
wte, wpe = rng.normal(0, 0.2, size=(V, d)), rng.normal(0, 0.2, size=(C, d))
blocks = [make_weights(d, H, rng) for _ in range(L)]
out = gpt2_forward([3, 14, 15, 9, 2], wte, wpe, blocks, np.ones(d), np.zeros(d), H)
print(out.shape)
