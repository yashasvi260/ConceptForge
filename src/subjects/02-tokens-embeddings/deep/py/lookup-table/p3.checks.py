import numpy as np
IDS = DATA["pool"]["The bank approved the loan"]["ids"]

def check_only_used_rows_change(ns):
    G = ns["table_gradient"](30522, IDS, np.ones((7, 4)))
    changed = int((np.abs(G).sum(axis=1) > 0).sum())
    assert changed == 6, f"7 positions but 'the' appears twice: 6 distinct rows change, got {changed}"

def check_repeated_tokens_add_up(ns):
    g = np.arange(28, dtype=float).reshape(7, 4)
    G = ns["table_gradient"](30522, IDS, g)
    assert np.allclose(G[1996], g[1] + g[4]), f"'the' (positions 1 and 4) must get the sum of both gradients, got {G[1996]}"

def check_unused_rows_stay_zero(ns):
    G = ns["table_gradient"](30522, IDS, np.ones((7, 4)))
    assert not G[5000].any(), "a token that is not in the batch gets no gradient at all"
