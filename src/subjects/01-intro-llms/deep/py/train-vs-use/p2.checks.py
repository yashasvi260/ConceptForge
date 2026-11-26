def check_first_step_matches_the_worked_example(ns):
    got = ns["train_step"](1.0, 2.0, 6.0, 0.05)
    assert abs(got - 1.8) < 1e-9, f"from w = 1: gradient is -16, so w becomes 1 - 0.05 × (-16) = 1.8; got {got}"

def check_training_approaches_w_3(ns):
    w = 1.0
    for _ in range(50):
        w = ns["train_step"](w, 2.0, 6.0, 0.05)
    assert abs(w - 3) < 1e-3, f"after 50 steps w should be close to 3 (since 3 × 2 = 6), got {w}"

def check_inference_just_uses_w(ns):
    got = ns["predict"](1.8, 2.0)
    assert abs(got - 3.6) < 1e-12, f"inference computes w × x = 1.8 × 2 = 3.6 and changes nothing; got {got}"
