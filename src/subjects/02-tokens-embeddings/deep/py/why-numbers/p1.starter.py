def split_words(text):
    """Cut on whitespace: the simplest word tokenizer."""
    # TODO: one call to a str method
    return []

def split_chars(text):
    """One token per Unicode character (code point)."""
    # TODO
    return []

def split_bytes(text):
    """One token per UTF-8 byte: a list of ints from 0 to 255."""
    # TODO: encode the text as UTF-8, then turn the bytes into a list
    return []

for row in DATA["languages"][:4]:
    t = row["text"]
    print(f'{row["label"]:<9} words={len(split_words(t)):<3} chars={len(split_chars(t)):<3} bytes={len(split_bytes(t)):<4} GPT-4o tokens={row["o200k_base"]}')
