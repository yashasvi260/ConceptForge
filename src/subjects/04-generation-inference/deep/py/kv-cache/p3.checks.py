steps_c = DATA["gen"]["kv"]["steps_cache"]
steps_n = DATA["gen"]["kv"]["steps_nocache"]

def check_matches_real_loop(ns):
    P, G = steps_c[0]["fed"], len(steps_c)
    assert ns["kv_projections"](P, G, True) == sum(s["fed"] for s in steps_c), "with the cache GPT-2 was fed 24 tokens in 20 steps"
    assert ns["kv_projections"](P, G, False) == sum(s["fed"] for s in steps_n), "without it, 290"

def check_products(ns):
    q = ns["query_key_products"]
    assert q(3, 1, True) == q(3, 1, False) == 6, "one step on a 3-token prompt: 1 + 2 + 3 = 6 products either way"
    assert q(3, 3, True) == 6 + 4 + 5, "with a cache, the next two steps add only the newest rows: 4 and 5"
    assert q(3, 3, False) == 6 + 10 + 15, "without one, each step redoes the whole triangle: 6 + 10 + 15"

def check_gap_grows(ns):
    r1 = ns["query_key_products"](512, 64, False) / ns["query_key_products"](512, 64, True)
    r2 = ns["query_key_products"](512, 256, False) / ns["query_key_products"](512, 256, True)
    assert r2 > r1 > 10, f"the saving grows with the output length: {r1:.0f}× for 64 tokens, {r2:.0f}× for 256"
