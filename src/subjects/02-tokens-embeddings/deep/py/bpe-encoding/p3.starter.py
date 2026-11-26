def encode_text(text, merges):
    """Tokenize a sentence: encode each space-separated word and join the token lists."""
    # TODO
    return []

def decode(tokens):
    """Join the tokens, turn each </w> back into a space, and trim the trailing space."""
    # TODO
    return ""

toks = encode_text("lowest newer slowly", MERGES)
print(toks, len(toks))
print(repr(decode(toks)))
