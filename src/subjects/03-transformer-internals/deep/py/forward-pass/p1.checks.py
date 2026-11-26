M = {m["name"]: m for m in DATA["models"]}

def check_gpt2_shapes(ns):
    s = ns["stage_shapes"](12, M["GPT-2 small"])
    assert tuple(s["vectors"]) == (12, 768), f"12 tokens × d_model 768, got {s['vectors']}"
    assert tuple(s["attention"]) == (12, 12, 12), f"12 heads, each a 12 × 12 table of weights, got {s['attention']}"
    assert tuple(s["ffn_hidden"]) == (12, 3072), f"the feed-forward layer widens each token to 3,072, got {s['ffn_hidden']}"

def check_blocks_keep_the_shape(ns):
    s = ns["stage_shapes"](100, M["Llama 3 8B"])
    assert tuple(s["block_output"]) == tuple(s["vectors"]) == (100, 4096), "a block's output has the same shape as its input, so blocks can be stacked"
    assert tuple(s["attention"]) == (32, 100, 100), "Llama 3 8B has 32 query heads; attention grows with n × n"
