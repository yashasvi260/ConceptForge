# Worked example for "BPE: tokenizing new words": replay the ten learned merges, in order, on unseen words.
import json

merges = [tuple(m) for m in DATA["bpe"]["merges"]]

def apply(symbols, pair):
    a, b = pair
    out, i = [], 0
    while i < len(symbols):
        if i + 1 < len(symbols) and symbols[i] == a and symbols[i + 1] == b:
            out.append(a + b)
            i += 2
        else:
            out.append(symbols[i])
            i += 1
    return out

def encode(word, merges):
    symbols, fired = list(word) + ["</w>"], []
    for m in merges:
        new = apply(symbols, m)
        if new != symbols:
            fired.append(m[0] + m[1])
        symbols = new
    return symbols, fired

rows = []
for w in ["lowest", "newer", "slowly", "wider", "newest"]:
    toks, fired = encode(w, merges)
    rows.append([w, ", ".join(fired) or "none", " ".join(toks), len(toks)])

trace, symbols = [], list("lowest") + ["</w>"]
for m in merges:
    new = apply(symbols, m)
    if new != symbols:
        trace.append([f"{m[0]} + {m[1]}", " ".join(new), len(new)])
    symbols = new

print(json.dumps({
    "Unseen words through the ten learned merges": rows,
    "Encoding lowest, one merge at a time": [["start", " ".join(list("lowest") + ["</w>"]), 7]] + trace,
}))
