LANG = {row["label"]: row for row in DATA["languages"]}

def check_english_counts(ns):
    t = LANG["English"]["text"]
    got = (len(ns["split_words"](t)), len(ns["split_chars"](t)), len(ns["split_bytes"](t)))
    assert got == (10, 52, 52), f"English should give (words, chars, bytes) = (10, 52, 52), got {got}"

def check_hindi_needs_more_bytes_than_characters(ns):
    t = LANG["Hindi"]["text"]
    got = (len(ns["split_chars"](t)), len(ns["split_bytes"](t)))
    assert got == (42, 108), f"Hindi should be 42 characters but 108 UTF-8 bytes, got {got}"

def check_bytes_are_ints_from_0_to_255(ns):
    got = ns["split_bytes"]("é🤖")
    assert got == [195, 169, 240, 159, 164, 150], f"'é🤖' is 2 + 4 bytes: [195, 169, 240, 159, 164, 150], got {got}"

def check_japanese_has_no_spaces_to_split_on(ns):
    got = len(ns["split_words"](LANG["Japanese"]["text"]))
    assert got == 1, f"the Japanese sentence has no spaces, so whitespace splitting gives 1 'word', got {got}"
