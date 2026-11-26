def check_llama_3_8b_is_8_030_261_248(ns):
    got = ns["llama_params"](DATA["llama3-8b"])
    assert got == 8_030_261_248, f"Llama 3 8B has exactly 8,030,261,248 parameters; you got {got:,}"
