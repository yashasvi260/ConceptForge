IDS = DATA["bert_ids"]

def check_real_bert_ids_with_specials(ns):
    got = ns["bert_encode"](["the", "river", "bank"], IDS)
    assert got == [101, 1996, 2314, 2924, 102], f"[CLS]=101, the=1996, river=2314, bank=2924, [SEP]=102; got {got}"

def check_missing_piece_becomes_unk(ns):
    got = ns["bert_encode"](["the", "zorbix"], IDS)
    assert got == [101, 1996, 100, 102], f"a piece missing from the vocabulary becomes [UNK]=100: [101, 1996, 100, 102], got {got}"

def check_continuation_pieces_have_their_own_ids(ns):
    got = ns["bert_encode"](["cat", "##s"], IDS)
    assert got == [101, 4937, 2015, 102], f"'##s' (continues a word) is its own entry, 2015: [101, 4937, 2015, 102], got {got}"
