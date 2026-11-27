import numpy as np
xs = np.array([-3.0, -1.0, -0.5, 0.0, 0.5, 1.0, 3.0])

def check_gelu_values(ns):
    assert np.allclose(ns["gelu"](xs), [-0.004, -0.159, -0.154, 0, 0.346, 0.841, 2.996], atol=1e-3), "GELU at -3, -1, -0.5, 0, 0.5, 1, 3"

def check_silu_values(ns):
    assert np.allclose(ns["silu"](xs), [-0.142, -0.269, -0.189, 0, 0.311, 0.731, 2.858], atol=1e-3), "SiLU at -3, -1, -0.5, 0, 0.5, 1, 3"

def check_smooth_relu_shape(ns):
    big = np.array([-20.0, 20.0])
    assert np.allclose(ns["gelu"](big), [0, 20], atol=1e-6), "far from 0, GELU behaves like ReLU: 0 for very negative inputs, x for very positive"
    assert ns["gelu"](np.array([-0.75]))[0] < 0, "unlike ReLU, GELU dips slightly below 0 for small negative inputs"
