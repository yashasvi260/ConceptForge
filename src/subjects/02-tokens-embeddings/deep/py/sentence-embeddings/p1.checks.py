import numpy as np

def check_reproduces_minilm_sentence_vectors(ns):
    for text, p in DATA["pool"].items():
        v = ns["mean_pool"](p["vectors"], [1] * len(p["tokens"]))
        assert np.allclose(v, p["sentence"], atol=2e-3), f"{text!r}: mean of all token vectors, normalised, should equal MiniLM's sentence vector"

def check_result_has_length_one(ns):
    p = DATA["pool"]["The bank approved the loan"]
    v = ns["mean_pool"](p["vectors"], [1] * 7)
    assert abs(np.linalg.norm(v) - 1) < 1e-9, f"normalise to length 1, got length {np.linalg.norm(v)}"

def check_pooling_must_match_training(ns):
    p = DATA["pool"]["I forgot my login details"]
    words_only = ns["mean_pool"](p["vectors"], [0] + [1] * 6 + [0])
    official = np.array(p["sentence"]) / np.linalg.norm(p["sentence"])
    got = float(words_only @ official)
    assert abs(got - 0.9737) < 1e-3, f"dropping [CLS] and [SEP] gives a different vector (cosine 0.974), got {got:.4f}"
