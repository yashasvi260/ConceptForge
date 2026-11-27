import numpy as np
M = {m["name"]: m for m in DATA["models"]}

def weight_shapes(d, f):
    """The shape of every weight in one GPT-2 block, with the same keys as make_weights (f = feed-forward width)."""
    # TODO
    return {}

def gpt2_params(cfg):
    """All of GPT-2's parameters: token and position tables, every block (from weight_shapes) and a final LayerNorm."""
    # TODO
    return 0

print(sum(int(np.prod(s)) for s in weight_shapes(768, 3072).values()), gpt2_params(M["GPT-2 small"]))
