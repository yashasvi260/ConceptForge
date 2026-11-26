def encode_text(text, merges):
    """Tokenize a sentence: encode each space-separated word and join the token lists."""
    return [t for w in text.split() for t in encode_by_rank(w, merges)]

def decode(tokens):
    """Join the tokens, turn each </w> back into a space, and trim the trailing space."""
    return "".join(tokens).replace("</w>", " ").strip()

toks = encode_text("lowest newer slowly", MERGES)
print(toks, len(toks))
print(repr(decode(toks)))
