def chunk(ids, size, overlap):
    """Split a token list into windows of `size` tokens, each starting `size - overlap` after the previous one,
    so text cut at a boundary appears whole in the next window. The last window may be shorter."""
    if not 0 <= overlap < size:
        raise ValueError("overlap must be at least 0 and smaller than size")
    out, start = [], 0
    while True:
        out.append(ids[start:start + size])
        if start + size >= len(ids):
            return out
        start += size - overlap

doc = list(range(1000))  # stand-in for a 1,000-token document
for size, overlap in [(200, 0), (200, 50), (500, 100)]:
    c = chunk(doc, size, overlap)
    print(size, overlap, len(c), "chunks,", sum(map(len, c)), "tokens stored")
