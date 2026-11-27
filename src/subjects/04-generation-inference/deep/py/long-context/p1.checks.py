M = {m["name"]: m for m in DATA["models"]}
args = lambda m: (m["nonembedding_params"], m["layers"], m["d_model"])

def check_formula(ns):
    assert ns["flops_per_token"](100, 2, 10, 5) == 2 * 100 + 2 * 2 * 5 * 10, "2N + 2 · layers · context · d_model"

def check_real_models(ns):
    ll, g2 = M["Llama 3 8B"], M["GPT-2 small"]
    assert abs(ns["attention_share"](*args(ll), 8192) - 0.1332) < 1e-3, "Llama 3 8B at its 8,192-token context: about 13% of the FLOPs are attention"
    assert abs(ns["crossover"](*args(ll)) - 53250) < 1, f"Llama 3 8B: attention matches the rest at about 53,250 tokens, got {ns['crossover'](*args(ll))}"
    assert abs(ns["crossover"](*args(g2)) - 9229) < 1, "GPT-2 small: at about 9,229 tokens, nine times its context limit"

def check_grows(ns):
    ll = M["Llama 3 8B"]
    a, b = ns["attention_share"](*args(ll), 8192), ns["attention_share"](*args(ll), 131072)
    assert b > 0.65 > a, f"at 131,072 tokens attention is most of the work ({b:.2f}); at 8,192 it isn't ({a:.2f})"
