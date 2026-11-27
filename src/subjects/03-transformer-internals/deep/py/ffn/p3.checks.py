M = {m["name"]: m for m in DATA["models"]}

def check_two_thirds_rule(ns):
    w = ns["matching_swiglu_width"](4096)
    assert abs(w - 10922.67) < 0.01, f"8 × 4096 / 3 = 10,922.67 (got {w})"
    assert abs(3 * 768 * ns["matching_swiglu_width"](768) - 2 * 768 * 3072) < 1e-6, "at that width, SwiGLU's three matrices hold exactly as many numbers as GELU's two"

def check_llama3_is_wider(ns):
    assert abs(ns["swiglu_vs_gelu"](M["Llama 3 8B"]) - 1.3125) < 1e-9, "Llama 3 8B's 14,336-wide SwiGLU network is 1.3125× the size of a 4× GELU network"
