TRAIN = "the cat sat on the mat the dog sat on the log"

def check_new_words_are_unknown(ns):
    got = ns["oov_rate"](TRAIN, "the cats sat on the rug", "words")
    assert abs(got - 2 / 6) < 1e-9, f"'cats' and 'rug' are 2 of 6 words not seen in training: 0.333, got {got}"

def check_characters_miss_unseen_letters(ns):
    got = ns["oov_rate"](TRAIN, "the cats sat on the rug", "chars")
    assert abs(got - 2 / 23) < 1e-9, f"only 'r' and 'u' are unseen: 2 of 23 characters (spaces count), got {got}"

def check_an_emoji_is_unknown_as_a_character(ns):
    got = ns["oov_rate"](TRAIN, "the cat sat 🤖", "chars")
    assert abs(got - 1 / 13) < 1e-9, f"the emoji is 1 unknown character of 13, got {got}"

def check_bytes_are_never_unknown(ns):
    for text in ["the cats sat on the rug", "the cat sat 🤖", "आज"]:
        got = ns["oov_rate"](TRAIN, text, "bytes")
        assert got == 0, f"every byte value 0–255 is in the vocabulary, so nothing is unknown; got {got} for {text!r}"
