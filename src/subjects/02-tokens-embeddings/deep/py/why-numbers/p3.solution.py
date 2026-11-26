SCHEMES = {"words": split_words, "chars": split_chars, "bytes": split_bytes}

def oov_rate(train_text, test_text, scheme):
    """Share of the test text's tokens that are missing from the vocabulary.

    words and chars: the vocabulary is every distinct token in train_text.
    bytes: the vocabulary is always all 256 byte values, whatever the training text.
    """
    test = SCHEMES[scheme](test_text)
    vocab = set(range(256)) if scheme == "bytes" else set(SCHEMES[scheme](train_text))
    return sum(1 for t in test if t not in vocab) / len(test)

train = "the cat sat on the mat the dog sat on the log"
for text in ["the cats sat on the rug", "the cat sat 🤖"]:
    print(text, {s: round(oov_rate(train, text, s), 3) for s in SCHEMES})
