def check_gpt2_small_is_124_439_808(ns):
    got = ns["gpt2_params"](DATA["gpt2-small"])
    assert got == 124_439_808, f"GPT-2 small has exactly 124,439,808 parameters; you got {got:,}"

def check_also_works_for_gpt3(ns):
    c = DATA["gpt3-175b"]
    V, d, n, L, ff = c["vocab"], c["d_model"], c["context"], c["layers"], c["ffn"]
    want = V * d + n * d + L * (4 * d * d + 4 * d + 2 * d * ff + ff + d + 4 * d) + 2 * d
    got = ns["gpt2_params"](c)
    assert got == want, f"GPT-3 uses the same formula; expected {want:,}, got {got:,}"
