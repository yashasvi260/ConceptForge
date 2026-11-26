DOC = list(range(1000))

def check_overlap_adds_chunks(ns):
    c = ns["chunk"](DOC, 200, 50)
    assert len(c) == 7 and sum(map(len, c)) == 1300, f"200/50 on 1,000 tokens: 7 chunks, 1,300 tokens stored; got {len(c)}, {sum(map(len, c))}"
    assert c[-1] == DOC[900:1000], f"the last chunk is tokens 900–999, got {c[-1][:3]}…"

def check_neighbours_share_the_overlap(ns):
    c = ns["chunk"](DOC, 200, 50)
    for a, b in zip(c, c[1:]):
        assert a[-50:] == b[:50], "each chunk must start with the last 50 tokens of the previous one"

def check_short_documents_are_one_chunk(ns):
    got = ns["chunk"](list(range(30)), 200, 50)
    assert got == [list(range(30))], f"a 30-token document is a single chunk, got {len(got)} chunks"
