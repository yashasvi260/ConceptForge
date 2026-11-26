def check_splits_words_and_punctuation(ns):
    got = ns["tokenize"]("The cat sat. The dog ate!")
    assert got == ["the", "cat", "sat", ".", "the", "dog", "ate", "!"], f"got {got}"

def check_handles_newlines_and_apostrophes(ns):
    got = ns["tokenize"]("I can't\nsign IN, sorry?")
    assert got == ["i", "can't", "sign", "in", ",", "sorry", "?"], f"got {got}"
