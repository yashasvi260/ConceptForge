def check_ratio_is_about_2200(ns):
    f = ns["forward_flops"]
    e, a = f(22_713_216, 10), f(8_030_261_248, 62)
    assert e and round(a / e) == 2192, f"the decoder should cost about 2,192× more here, got {a / e if e else 0:.0f}×"
