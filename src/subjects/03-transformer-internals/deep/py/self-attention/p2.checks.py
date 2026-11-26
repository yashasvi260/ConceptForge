import numpy as np
ATTN = np.array(DATA["gpt2"]["sentences"][0]["attn"])

def check_score_on_a_pattern(ns):
    shift = np.eye(5, k=-1); shift[0, 0] = 1
    assert np.isclose(ns["previous_token_score"](shift), 1.0), "a head that always looks one token back scores 1"
    assert np.isclose(ns["previous_token_score"](np.eye(5)), 0.0), "a head that only looks at itself scores 0"

def check_finds_gpt2_previous_token_head(ns):
    assert tuple(ns["best_previous_head"](ATTN)) == (4, 11), "in real GPT-2 small, layer 4 head 11 is the previous-token head"
    assert ns["previous_token_score"](ATTN[4, 11]) > 0.99, "it puts more than 99% of its weight one token back"
