MERGES = [tuple(m) for m in DATA["merges"]]
WORDS = ["lowest", "newer", "slowly", "wider", "newest", "low", "lower", "widest", "west", "zebra", "a"]

def check_same_result_as_replaying_every_merge(ns):
    for w in WORDS:
        fast, slow = ns["encode_by_rank"](w, MERGES), ns["encode_word"](w, MERGES)
        assert fast == slow, f"{w!r}: by rank {fast}, in order {slow}; both methods must agree"

def check_newest_is_one_token(ns):
    got = ns["encode_by_rank"]("newest", MERGES)
    assert got == ["newest</w>"], f"'newest' was frequent in training, so it is one token: ['newest</w>'], got {got}"

def check_unknown_letters_stay_single_characters(ns):
    got = ns["encode_by_rank"]("zebra", MERGES)
    assert got == ["z", "e", "b", "r", "a", "</w>"], f"no merge applies to 'zebra': single characters, got {got}"
