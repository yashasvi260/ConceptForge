M = {m["name"]: m for m in DATA["models"]}

def check_gpt2_block(ns):
    a, f, n = ns["gpt2_block_params"](768, 3072)
    assert (a, f, n) == (2362368, 4722432, 3072), f"GPT-2 small's block: (2,362,368, 4,722,432, 3,072), got {(a, f, n)}"

def check_matches_published_total(ns):
    for name in ["GPT-2 small", "GPT-3 175B"]:
        got = ns["gpt2_total"](M[name])
        assert got == M[name]["total_params"], f"{name}: expected {M[name]['total_params']:,} (from its published config), got {got:,}"
