def check_minilm_table_memory(ns):
    got = ns["table_bytes"](30522, 384, 4)
    assert got == 46_881_792, f"30,522 × 384 × 4 bytes = 46,881,792 (about 46.9 MB), got {got}"

def check_half_precision_halves_it(ns):
    got = ns["table_bytes"](128256, 4096, 2)
    assert got == 1_050_673_152, f"Llama 3 8B's table in float16: 128,256 × 4,096 × 2 = 1,050,673,152 bytes, got {got}"

def check_lookup_saves_a_factor_of_the_vocabulary(ns):
    got = ns["matmul_vs_lookup"](30522, 384)
    assert got == 30522, f"the one-hot product does V × d work to fetch d numbers: a factor of V = 30,522, got {got}"
