def check_llama_in_16_bit_is_about_16_GB(ns):
    got = ns["memory_gb"](8_030_261_248, 16)
    assert abs(got - 16.06) < 0.01, f"8,030,261,248 × 2 bytes ≈ 16.06 GB; you got {got}"

def check_halving_the_bits_halves_the_memory(ns):
    a, b = ns["memory_gb"](1e9, 8), ns["memory_gb"](1e9, 4)
    assert abs(a - 1.0) < 1e-9 and abs(b - 0.5) < 1e-9, f"1 billion parameters: 8-bit = 1 GB, 4-bit = 0.5 GB; got {a}, {b}"
