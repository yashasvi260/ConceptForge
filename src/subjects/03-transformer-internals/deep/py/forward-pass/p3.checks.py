M = {m["name"]: m for m in DATA["models"]}
m = M["Llama 3 8B"]

def check_llama_block(ns):
    got = ns["llama_block_params"](m["d_model"], m["ffn"], m["heads"], m["kv_heads"])
    assert tuple(got) == (41943040, 176160768, 8192), f"Llama 3 8B's block: (41,943,040, 176,160,768, 8,192), got {got}"

def check_adds_up_to_8b(ns):
    d = m["d_model"]
    total = 2 * m["vocab"] * d + m["layers"] * sum(ns["llama_block_params"](d, m["ffn"], m["heads"], m["kv_heads"])) + d
    assert total == m["total_params"], f"token table + 32 blocks + final norm + separate output head should be {m['total_params']:,}, got {total:,}"

def check_ffn_share(ns):
    a, f, n = 41943040, 176160768, 8192
    assert abs(ns["ffn_share"](a, f, n) - 80.8) < 0.05, "about 80.8% of a Llama 3 8B block is its feed-forward network"
