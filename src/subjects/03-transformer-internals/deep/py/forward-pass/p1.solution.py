M = {m["name"]: m for m in DATA["models"]}  # published configs: d_model, heads, ffn, layers, ...

def stage_shapes(n, cfg):
    """The shape of the data at each stage of the forward pass, for n tokens.
    Keys: "ids", "vectors", "attention", "ffn_hidden", "block_output"."""
    d = cfg["d_model"]
    return {
        "ids": (n,),
        "vectors": (n, d),
        "attention": (cfg["heads"], n, n),
        "ffn_hidden": (n, cfg["ffn"]),
        "block_output": (n, d),
    }

for k, v in stage_shapes(12, M["GPT-2 small"]).items():
    print(k, v)
