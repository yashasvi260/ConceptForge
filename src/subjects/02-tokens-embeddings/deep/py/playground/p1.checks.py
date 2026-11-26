BY = {r["label"]: r for r in DATA["languages"]}

def check_hindi_saving(ns):
    got = ns["saving_pct"](BY["Hindi"])
    assert abs(got - 100 * 31 / 45) < 1e-9, f"Hindi: (45 − 14) / 45 = 68.9%, got {got}"

def check_code_and_numbers_do_not_change(ns):
    got = (ns["saving_pct"](BY["Code"]), ns["saving_pct"](BY["Numbers"]))
    assert got == (0, 0), f"code (21 → 21) and numbers (17 → 17) save nothing, got {got}"

def check_biggest_saving(ns):
    got = ns["biggest_saving"](DATA["languages"])
    assert got == "Hindi", f"Hindi gains most, got {got}"
