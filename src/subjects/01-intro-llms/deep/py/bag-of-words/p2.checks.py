def check_film_and_movie_score_one_half(ns):
    got = ns["cosine"]([1, 1, 1, 1, 0, 0], [1, 0, 1, 0, 1, 1])
    assert abs(got - 0.5) < 1e-9, f"2 shared words out of 4 each: 2 / (2 × 2) = 0.5, got {got}"

def check_word_order_is_invisible(ns):
    v = ns["vectorize"]
    V = ["dog", "bites", "man"]
    got = ns["cosine"](v("Dog bites man", V), v("Man bites dog", V))
    assert abs(got - 1) < 1e-9, f"same words, different order: Bag-of-Words can't tell them apart, so cosine is 1; got {got}"

def check_zero_vectors_give_zero(ns):
    assert ns["cosine"]([0, 0], [1, 2]) == 0.0, "no shared information: return 0.0 instead of dividing by zero"
