# Worked example for "WordPiece (BERT)": greedy longest-match on real BERT pieces, and how WordPiece's
# training score ranks pairs differently from BPE's raw count.
import json
from collections import Counter

vocab = DATA["tokens"]["wordpiece"]["vocab"]

def longest_match(word):
    pieces, start = [], 0
    while start < len(word):
        end = len(word)
        while end > start:
            sub = ("##" if start else "") + word[start:end]
            if sub in vocab:
                break
            end -= 1
        else:
            return None
        pieces.append(sub)
        start = end
    return pieces

rows = []
for w in ["huggingface", "unaffable", "tokenization", "embeddings", "kubernetes"]:
    p = longest_match(w)
    rows.append([w, " ".join(p), " ".join(str(vocab[x]) for x in p), len(p)])

words = Counter(DATA["bpe"]["corpus"].split())
seqs = {w: list(w) + ["</w>"] for w in words}
sym, pair = Counter(), Counter()
for w, s in seqs.items():
    for x in s:
        sym[x] += words[w]
    for a, b in zip(s, s[1:]):
        pair[(a, b)] += words[w]
score = {p: c / (sym[p[0]] * sym[p[1]]) for p, c in pair.items()}
by_count = sorted(pair, key=lambda p: -pair[p])[:4]
by_score = sorted(pair, key=lambda p: -score[p])[:4]

print(json.dumps({
    "Greedy longest-match with BERT's real vocabulary": rows,
    "Which pair goes first: BPE count vs WordPiece score": [
        [i + 1, f"{a[0]} + {a[1]}", pair[a], f"{b[0]} + {b[1]}", round(score[b], 3)]
        for i, (a, b) in enumerate(zip(by_count, by_score))
    ],
}))
