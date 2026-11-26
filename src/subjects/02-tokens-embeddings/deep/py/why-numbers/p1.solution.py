def split_words(text):
    """Cut on whitespace: the simplest word tokenizer."""
    return text.split()

def split_chars(text):
    """One token per Unicode character (code point)."""
    return list(text)

def split_bytes(text):
    """One token per UTF-8 byte: a list of ints from 0 to 255."""
    return list(text.encode("utf-8"))

for row in DATA["languages"][:4]:
    t = row["text"]
    print(f'{row["label"]:<9} words={len(split_words(t)):<3} chars={len(split_chars(t)):<3} bytes={len(split_bytes(t)):<4} GPT-4o tokens={row["o200k_base"]}')
