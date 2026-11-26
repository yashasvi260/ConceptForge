import numpy as np

def check_film_vs_movie_is_0_891(ns):
    v = ns["vectors"]
    got = round(ns["cosine"](v["The film was great"], v["The movie was excellent"]), 3)
    assert got == 0.891, f"the real MiniLM vectors give 0.891 here, got {got}"

def check_cosine_ignores_length(ns):
    a, b = np.array([1.0, 2.0, 3.0]), np.array([2.0, 4.0, 6.0])
    got = ns["cosine"](a, b)
    assert abs(got - 1) < 1e-9, f"b is just a longer copy of a, so cosine should be 1; got {got}"
