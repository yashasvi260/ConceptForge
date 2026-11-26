import numpy as np
IDS = DATA["pool"]["The bank approved the loan"]["ids"]
E = np.random.default_rng(1).normal(size=(30522, 8))

def check_lookup_takes_rows(ns):
    got = ns["lookup"](E, IDS)
    assert got.shape == (7, 8), f"7 tokens × 8 numbers, got {got.shape}"
    assert np.array_equal(got[2], E[2924]), "the third token is 'bank' (ID 2924): its vector must be row 2924"

def check_one_hot_product_is_the_same(ns):
    assert np.allclose(ns["one_hot_lookup"](E, IDS), E[IDS]), "one-hot × table must give exactly the looked-up rows"

def check_same_word_same_vector(ns):
    got = ns["lookup"](E, IDS)
    assert np.array_equal(got[1], got[4]), "'the' appears at positions 1 and 4 with the same ID, so the table gives the same row"
