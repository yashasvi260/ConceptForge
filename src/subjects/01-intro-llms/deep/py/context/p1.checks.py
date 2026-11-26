def check_money_bank(ns):
    got = [round(x, 3) for x in ns["contextual"]("bank", ["cash", "loan"])]
    assert got == [0.8, 0.2], f"(0.5 + 1.0 + 0.9) / 3 = 0.8 and (0.5 + 0 + 0.1) / 3 = 0.2, so expected [0.8, 0.2]; got {got}"

def check_river_bank(ns):
    got = [round(x, 3) for x in ns["contextual"]("bank", ["river", "flooded"])]
    assert got == [0.2, 0.8], f"expected [0.2, 0.8]; got {got}"

def check_static_table_is_unchanged(ns):
    assert ns["static"]["bank"] == [0.5, 0.5], "don't modify the static table: context makes a new vector"
