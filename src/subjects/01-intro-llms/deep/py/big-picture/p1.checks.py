def check_counts_what_follows_the(ns):
    c = ns["count_bigrams"]("the cat sat on the mat . the cat ate the fish . the dog sat on the rug .".split())
    assert c.get("the") == {"cat": 2, "mat": 1, "fish": 1, "dog": 1, "rug": 1}, f"after 'the' expected cat 2, mat 1, fish 1, dog 1, rug 1 but got {c.get('the')}"

def check_counts_every_pair(ns):
    c = ns["count_bigrams"](["a", "b", "a", "b", "c"])
    assert c == {"a": {"b": 2}, "b": {"a": 1, "c": 1}}, f"for a b a b c expected {{'a': {{'b': 2}}, 'b': {{'a': 1, 'c': 1}}}} but got {c}"

def check_last_token_has_no_followers(ns):
    c = ns["count_bigrams"](["x", "y"])
    assert "y" not in c, "the last token has nothing after it, so it should not be a key"
