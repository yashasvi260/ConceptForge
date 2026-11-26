def check_llama_training_is_about_7_2e23(ns):
    got = ns["train_flops"](8_030_261_248, 15e12)
    assert abs(got / 7.227e23 - 1) < 1e-2, f"6 × 8.03e9 × 15e12 ≈ 7.23e23, got {got:.3e}"

def check_one_token_is_about_1_6e10(ns):
    got = ns["flops_per_generated_token"](8_030_261_248)
    assert abs(got / 1.606e10 - 1) < 1e-2, f"2 × 8.03e9 ≈ 1.61e10, got {got:.3e}"
