def check_generates_n_tokens_from_the_vocabulary(ns):
    out = ns["generate"](ns["counts"], ns["vocab"], "the", 10, temperature=1.0, seed=3)
    assert len(out) == 11 and out[0] == "the", f"start token + 10 new tokens, got {len(out)}"
    assert all(t in ns["vocab"] for t in out), "every token must come from the vocabulary"

def check_temperature_0_is_greedy_and_repeatable(ns):
    g = ns["generate"]
    a = g(ns["counts"], ns["vocab"], "the", 6, temperature=0, seed=1)
    b = g(ns["counts"], ns["vocab"], "the", 6, temperature=0, seed=99)
    assert a == b, "greedy decoding ignores the seed"
    assert a[1] in ("cat", "dog", "bird"), f"after 'the' the greedy pick should be a seen follower, got {a[1]!r}"

def check_sampling_varies_with_the_seed(ns):
    g = ns["generate"]
    outs = {tuple(g(ns["counts"], ns["vocab"], "the", 8, temperature=1.5, seed=s)) for s in range(5)}
    assert len(outs) > 1, "with sampling, different seeds should give different texts"
