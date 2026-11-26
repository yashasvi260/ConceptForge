VOCAB = DATA["vocab"]

def check_real_ids(ns):
    got = ns["wordpiece_ids"]("HuggingFace tokenization", VOCAB)
    assert got == [17662, 12172, 19204, 3989], f"hugging ##face token ##ization = [17662, 12172, 19204, 3989], got {got}"

def check_whole_word_becomes_one_unk(ns):
    v = {"a": 1, "##b": 2, "[UNK]": 100}
    got = ns["wordpiece_ids"]("ab abz", v)
    assert got == [1, 2, 100], f"'ab' → [1, 2]; 'abz' fails at 'z', so the WHOLE word is one [UNK]: [1, 2, 100], got {got}"
