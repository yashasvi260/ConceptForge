def check_ratio_is_about_2200(ns):
    f = ns["forward_flops"]
    e, a = f(22_713_216, 10), f(8_030_261_248, 62)
    assert e and round(a / e) == 2192, f"the decoder should cost about 2,192× more here, got {a / e if e else 0:.0f}×"

def check_two_operations_per_parameter_per_token(ns):
    got = ns["forward_flops"](1_000_000_000, 1)
    assert got == 2_000_000_000, f"1 billion parameters reading 1 token: about 2 operations each = 2e9, got {got:.3g}"
