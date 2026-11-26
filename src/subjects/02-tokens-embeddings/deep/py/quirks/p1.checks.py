BY = {r["label"]: r for r in DATA["languages"]}

def check_rule_of_thumb_is_close_for_english(ns):
    got = ns["error_pct"](BY["English"])
    assert got == 8, f"English: 13 estimated vs 12 real = +8%, got {got}"

def check_rule_of_thumb_fails_for_japanese_and_code(ns):
    got = (ns["error_pct"](BY["Japanese"]), ns["error_pct"](BY["Code"]))
    assert got == (-65, -43), f"Japanese 6 vs 17 = -65%, code 12 vs 21 = -43%; got {got}"

def check_input_and_output_are_priced_separately(ns):
    got = ns["request_cost"](1000, 500, {"input": 2.50, "output": 10.00})
    assert abs(got - 0.0075) < 1e-12, f"1,000 × 2.50/1M + 500 × 10.00/1M = 0.0075, got {got}"
