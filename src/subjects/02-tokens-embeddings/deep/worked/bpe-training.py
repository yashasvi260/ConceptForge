# Worked example for "BPE: learning the pieces": ten merges on the Sennrich et al. (2016) corpus.
import json
from collections import Counter

words = Counter(DATA["bpe"]["corpus"].split())
symbols = {w: tuple(w) + ("</w>",) for w in words}
vocab = sorted({s for syms in symbols.values() for s in syms})

rows = []
for step in range(1, 11):
    pairs = Counter()
    for w, syms in symbols.items():
        for a, b in zip(syms, syms[1:]):
            pairs[(a, b)] += words[w]
    (a, b), count = max(pairs.items(), key=lambda kv: kv[1])  # ties: first pair seen wins
    for w, syms in symbols.items():
        out, i = [], 0
        while i < len(syms):
            if i + 1 < len(syms) and syms[i] == a and syms[i + 1] == b:
                out.append(a + b)
                i += 2
            else:
                out.append(syms[i])
                i += 1
        symbols[w] = tuple(out)
    vocab.append(a + b)
    rows.append([step, f"{a} + {b}", a + b, count, len(vocab)])

print(json.dumps({
    "The first ten merges on the Sennrich corpus": rows,
    "Every word after ten merges": [[w, words[w], " ".join(symbols[w])] for w in words],
    "start_vocab": len(vocab) - 10,
}))
