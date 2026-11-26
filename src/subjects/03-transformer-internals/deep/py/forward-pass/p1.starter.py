M = {m["name"]: m for m in DATA["models"]}  # published configs: d_model, heads, ffn, layers, ...

def stage_shapes(n, cfg):
    """The shape of the data at each stage of the forward pass, for n tokens.
    Keys: "ids", "vectors", "attention", "ffn_hidden", "block_output"."""
    # TODO: ids is (n,); vectors are n × d_model; attention weights are heads × n × n;
    #       the feed-forward hidden layer is n × ffn; every block's output has the same shape as its input.
    return {"ids": (0,), "vectors": (0, 0), "attention": (0, 0, 0), "ffn_hidden": (0, 0), "block_output": (0, 0)}

for k, v in stage_shapes(12, M["GPT-2 small"]).items():
    print(k, v)
