import numpy as np

def check_centroid_is_the_average(ns):
    c = ns["centroid"](["How do I reset my password?", "I forgot my login details"])
    assert c is not None and np.shape(c) == (384,), f"a centroid is one 384-number vector, got shape {np.shape(c)}"
    v = ns["vectors"]
    assert np.allclose(c, (v["How do I reset my password?"] + v["I forgot my login details"]) / 2), "it should be the mean of the two vectors"
