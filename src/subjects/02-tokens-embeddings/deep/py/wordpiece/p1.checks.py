VOCAB = DATA["vocab"]

def check_huggingface(ns):
    got = ns["longest_match"]("huggingface", VOCAB)
    assert got == ["hugging", "##face"], f"real BERT: ['hugging', '##face'], got {got}"

def check_unaffable_is_not_the_textbook_split(ns):
    got = ns["longest_match"]("unaffable", VOCAB)
    assert got == ["una", "##ffa", "##ble"], f"greedy longest-match takes 'una' first: ['una', '##ffa', '##ble'], got {got}"

def check_continuation_pieces(ns):
    got = ns["longest_match"]("embeddings", VOCAB)
    assert got == ["em", "##bed", "##ding", "##s"], f"expected ['em', '##bed', '##ding', '##s'], got {got}"

def check_no_match_returns_none(ns):
    got = ns["longest_match"]("abz", {"a": 1, "##b": 2})
    assert got is None, f"'z' matches nothing, so the whole word fails: None, got {got}"
