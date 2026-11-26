TEXTS = ["the cat sat on the mat", "the dog sat on the log"]
WANT = ["<pad>", "<unk>", "the", "on", "sat", "cat", "dog", "log", "mat"]

def check_vocab_order(ns):
    got = ns["build_vocab"](TEXTS)
    assert got == WANT, f"specials, then by count (the ×4, on ×2, sat ×2), ties A→Z: {WANT}, got {got}"

def check_encode_uses_positions_and_unk(ns):
    got = ns["encode"]("the cat sat on the rug", WANT)
    assert got == [2, 5, 4, 3, 2, 1], f"'rug' is unknown, so it gets <unk>'s ID 1: [2, 5, 4, 3, 2, 1], got {got}"

def check_decode_round_trips_known_words(ns):
    text = "the dog sat on the log"
    got = ns["decode"](ns["encode"](text, WANT), WANT)
    assert got == text, f"decode(encode(text)) should give back {text!r}, got {got!r}"

def check_unknown_words_are_lost(ns):
    got = ns["decode"](ns["encode"]("the rug", WANT), WANT)
    assert got == "the <unk>", f"an unknown word cannot come back: expected 'the <unk>', got {got!r}"
