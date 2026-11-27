import numpy as np

def check_angles(ns):
    a = ns["rope_angles"](10, 8, 10000)
    assert np.allclose(a, [10, 1, 0.1, 0.01]), f"d_head 8, base 10,000: frequencies 1, 0.1, 0.01, 0.001; at position 10 the angles are 10, 1, 0.1, 0.01 (got {np.round(a, 4).tolist()})"
    assert np.allclose(ns["rope_angles"](0, 128, 500000), 0), "position 0 isn't rotated"

def check_beyond_training(ns):
    trained = ns["rope_angles"](8191, 128, 500000)
    far = ns["rope_angles"](32767, 128, 500000)
    assert np.all(far[1:] > trained[1:]), "beyond 8,192 tokens every pair rotates further than it ever did in training"

def check_interpolation(ns):
    edge = ns["rope_angles"](8192, 128, 500000)          # the end of the trained range [0, 8,192)
    squeezed = ns["rope_angles"](ns["interpolate"](32767, 8192, 32768), 128, 500000)
    assert np.all(squeezed < edge), "after interpolation, position 32,767 lands inside the trained range (at 8,191.75)"
    assert ns["interpolate"](4, 8192, 32768) == 1.0, "positions are scaled by 8,192 / 32,768 = 1/4"
