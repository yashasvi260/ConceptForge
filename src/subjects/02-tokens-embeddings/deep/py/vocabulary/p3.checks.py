MODELS = {m["name"]: m for m in DATA["models"]}

def check_table_params(ns):
    got = ns["table_params"](128256, 4096)
    assert got == 525336576, f"Llama 3 8B's table is 128,256 × 4,096 = 525,336,576, got {got}"

def check_small_models_spend_a_lot_on_vocabulary(ns):
    got = ns["vocab_share"](MODELS["GPT-2 small"])
    assert abs(got - 31.02) < 0.05, f"GPT-2 small (tied): 38,597,376 / 124,439,808 ≈ 31.0%, got {got}"

def check_untied_models_pay_twice(ns):
    got = ns["vocab_share"](MODELS["Llama 3 8B"])
    assert abs(got - 13.08) < 0.05, f"Llama 3 8B has a separate output head: 2 × 525,336,576 / 8,030,261,248 ≈ 13.1%, got {got}"

def check_extra_params_for_a_bigger_vocabulary(ns):
    got = ns["extra_params"](100277, 200019, 4096, False)
    assert got == 2 * 99742 * 4096, f"99,742 new rows × 4,096 numbers × 2 tables = 817,086,464, got {got}"
