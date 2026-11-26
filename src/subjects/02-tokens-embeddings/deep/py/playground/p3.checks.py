def check_example_sentence(ns):
    got = ns["pretokenize"]("I'm paying 1250.75 dollars, OK?")
    want = ["I", "'m", " paying", " ", "125", "0", ".", "75", " dollars", ",", " OK", "?"]
    assert got == want, f"expected {want}, got {got}"

def check_nothing_is_lost(ns):
    for text in ["Hello,   world!\nNew line.", "café 日本語 x2", "  leading spaces"]:
        got = "".join(ns["pretokenize"](text))
        assert got == text, f"joining the chunks must give back the text exactly: {text!r} → {got!r}"

def check_words_keep_their_leading_space(ns):
    got = ns["pretokenize"]("the cat sat")
    assert got == ["the", " cat", " sat"], f"GPT tokens carry the space in front: ['the', ' cat', ' sat'], got {got}"
