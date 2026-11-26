S = ["The film was great", "The movie was excellent", "Dog bites man", "Man bites dog"]
V = ["the", "film", "was", "great", "movie", "excellent", "dog", "bites", "man"]

def check_vocabulary_in_first_seen_order(ns):
    got = ns["build_vocab"](S)
    assert got == V, f"expected {V}, got {got}"

def check_count_vectors(ns):
    got = ns["vectorize"]("The movie was excellent", V)
    assert got == [1, 0, 1, 0, 1, 1, 0, 0, 0], f"'The movie was excellent' should be [1, 0, 1, 0, 1, 1, 0, 0, 0], got {got}"

def check_repeated_words_are_counted(ns):
    got = ns["vectorize"]("the the dog", ["the", "dog", "cat"])
    assert got == [2, 1, 0], f"'the the dog' over [the, dog, cat] should be [2, 1, 0], got {got}"
