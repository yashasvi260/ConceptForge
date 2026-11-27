import numpy as np
NORMS = np.array(DATA["gpt2"]["residual_norms"]["norms"])

def check_first_token_explodes(ns):
    i, ratio = ns["biggest_growth"](NORMS)
    assert i == 0, "the first token's vector grows the most: it's the attention sink"
    assert 300 < ratio < 320, f"its length grows about 308×, from 10.1 to 3,112.4 (got {ratio:.1f})"

def check_final_norm(ns):
    assert 39 < ns["final_norm_shrink"](NORMS, 0) < 41, "the final LayerNorm shrinks the first token's vector about 40×, from 3,112 to 78"
    toy = np.ones((13, 2)); toy[11] = 10; toy[12] = 5
    assert np.isclose(ns["final_norm_shrink"](toy, 1), 2.0), "stage 11 length ÷ stage 12 length"
