import numpy as np
M = {m["name"]: m for m in DATA["models"]}

def weight_shapes(d, f):
    """The shape of every weight in one GPT-2 block, with the same keys as make_weights (f = feed-forward width)."""
    return {"ln1_g": (d,), "ln1_b": (d,), "attn_w": (d, 3 * d), "attn_b": (3 * d,), "proj_w": (d, d), "proj_b": (d,),
            "ln2_g": (d,), "ln2_b": (d,), "fc_w": (d, f), "fc_b": (f,), "out_w": (f, d), "out_b": (d,)}

def gpt2_params(cfg):
    """All of GPT-2's parameters: token and position tables, every block (from weight_shapes) and a final LayerNorm."""
    d = cfg["d_model"]
    block = sum(int(np.prod(s)) for s in weight_shapes(d, cfg["ffn"]).values())
    return cfg["vocab"] * d + cfg["context"] * d + cfg["layers"] * block + 2 * d

print(sum(int(np.prod(s)) for s in weight_shapes(768, 3072).values()), gpt2_params(M["GPT-2 small"]))
