import numpy as np
S, L = DATA["pool"]["The bank approved the loan"], DATA["pool"]["I forgot my login details"]
PAD = np.full(384, 0.1)

def check_shapes_and_mask(ns):
    X, mask = ns["pad_batch"]([S["vectors"], L["vectors"]], PAD)
    assert X.shape == (2, 8, 384), f"2 sentences, longest has 8 tokens, 384 numbers: (2, 8, 384), got {X.shape}"
    assert mask.tolist() == [[1, 1, 1, 1, 1, 1, 1, 0], [1] * 8], f"the 7-token sentence gets one padding position, got {mask.tolist()}"
    assert np.allclose(X[1], L["vectors"]) and np.allclose(X[0, 7], PAD), "real rows are copied unchanged; the padded row holds pad_vector"

def check_masked_pooling_ignores_padding(ns):
    X, mask = ns["pad_batch"]([S["vectors"], L["vectors"]], PAD)
    assert np.allclose(ns["mean_pool"](X[0], mask[0]), S["sentence"], atol=2e-3), "with the mask, padding must not change the sentence vector"

def check_padding_leaks_in_without_the_mask(ns):
    X, _ = ns["pad_batch"]([S["vectors"], L["vectors"]], PAD)
    leaked = ns["naive_pool"](X[0])
    assert not np.allclose(leaked, S["sentence"], atol=2e-3), "averaging the padded row changes the vector: that is why pooling needs the mask"
