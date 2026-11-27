import numpy as np
M = {m["name"]: m for m in DATA["models"]}

def check_shapes_match_your_block(ns):
    w = ns["make_weights"](8, 2, np.random.default_rng(0))
    shapes = ns["weight_shapes"](8, 32)
    assert set(shapes) == set(w), "the same 12 weights as make_weights"
    assert all(tuple(shapes[k]) == np.shape(w[k]) for k in w), "each shape must match the weight your block uses"

def check_gpt2_small_exactly(ns):
    assert sum(int(np.prod(s)) for s in ns["weight_shapes"](768, 3072).values()) == 7087872, "one GPT-2 small block: 7,087,872 parameters"
    assert ns["gpt2_params"](M["GPT-2 small"]) == 124439808, "GPT-2 small: 124,439,808 parameters in all"
