REAL = DATA["pieces"]

def check_matches_real_gpt4o_pieces(ns):
    for t in ["1234567", "2026", "3.14159"]:
        real = [p["text"] for p in REAL[t]["o200k_base"]]
        got = ns["split_digits"](t)
        assert got == real, f"{t!r}: GPT-4o really produces {real}, got {got}"

def check_chunks_do_not_line_up_with_place_value(ns):
    got = (ns["split_digits"]("1000"), ns["split_digits"]("10000"))
    assert got == (["100", "0"], ["100", "00"]), f"chunks are counted from the left, so 1000 → ['100', '0'] and 10000 → ['100', '00'], got {got}"
