import numpy as np
LOSS_UP = np.array(DATA["gpt2"]["head_ablation"]["loss_increase"])

def check_most_important_head(ns):
    assert tuple(ns["most_important"](LOSS_UP)) == (0, 10), "removing layer 0, head 10 hurts GPT-2 most (+0.486)"
    toy = np.zeros((3, 4)); toy[2, 1] = 5
    assert tuple(ns["most_important"](toy)) == (2, 1), "returns (layer, head) of the largest increase"

def check_most_heads_are_individually_cheap(ns):
    assert ns["count_below"](LOSS_UP, 0.01) == 78, "78 of 144 heads raise the loss by less than 0.01 when removed alone"
    assert ns["count_below"](LOSS_UP, 0.05) == 129, "129 of 144 by less than 0.05"
