def check_merges_inside_every_word(ns):
    got = ns["merge_pair"](("e", "s"), ns["start_words"](DATA["corpus"]))
    want = {("l", "o", "w", "</w>"): 5, ("l", "o", "w", "e", "r", "</w>"): 2,
            ("n", "e", "w", "es", "t", "</w>"): 6, ("w", "i", "d", "es", "t", "</w>"): 3}
    assert got == want, f"after merging 'e s': {want}, got {got}"

def check_overlapping_pairs_merge_left_to_right(ns):
    got = ns["merge_pair"](("a", "a"), {("a", "a", "a", "</w>"): 1})
    assert got == {("aa", "a", "</w>"): 1}, f"'a a a' merges the first two only: ('aa', 'a', '</w>'), got {got}"

def check_untouched_words_stay_the_same(ns):
    w = {("x", "y", "</w>"): 4}
    got = ns["merge_pair"](("e", "s"), w)
    assert got == w, f"a word without the pair is unchanged, got {got}"
