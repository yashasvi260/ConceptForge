MERGES = [tuple(m) for m in DATA["merges"]]

def check_sentence_tokens(ns):
    got = ns["encode_text"]("lowest newer slowly", MERGES)
    want = ["low", "est</w>", "new", "e", "r", "</w>", "s", "low", "l", "y", "</w>"]
    assert got == want, f"expected {want}, got {got}"

def check_decode_restores_the_text(ns):
    for text in ["lowest newer slowly", "the zebra was newest"]:
        got = ns["decode"](ns["encode_text"](text, MERGES))
        assert got == text, f"decode(encode(text)) should give {text!r}, got {got!r}"

def check_end_markers_become_spaces(ns):
    got = ns["decode"](["low</w>", "est</w>"])
    assert got == "low est", f"'low</w>' + 'est</w>' decodes to 'low est', got {got!r}"
