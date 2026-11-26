# Worked example for "SentencePiece and Unigram": score competing splits by summed log-probability,
# then let Viterbi find the best one. Uses the Unigram view's small illustrative vocabulary.
import json, math

vocab = DATA["unigram"]["vocab"]
UNK = DATA["unigram"]["unknown_char_logprob"]

def norm(text):
    return "▁" + "▁".join(text.split())

def score(pieces):
    return sum(vocab.get(p, UNK) for p in pieces)

def viterbi(text):
    s = norm(text)
    best, back = [0.0] + [-math.inf] * len(s), [0] * (len(s) + 1)
    for end in range(1, len(s) + 1):
        for start in range(end):
            piece = s[start:end]
            lp = vocab.get(piece, UNK if end - start == 1 else None)
            if lp is not None and best[start] + lp > best[end]:
                best[end], back[end] = best[start] + lp, start
    pieces, end = [], len(s)
    while end:
        pieces.insert(0, s[back[end]:end])
        end = back[end]
    return pieces, best[-1]

splits = [["▁hello", "▁world"], ["▁hell", "o", "▁world"], ["▁he", "llo", "▁world"], ["▁", "h", "e", "l", "l", "o", "▁", "w", "o", "r", "l", "d"]]
top = score(splits[0])
print(json.dumps({
    "Four ways to split hello world": [[" ".join(p), len(p), round(score(p), 3), round(math.exp(score(p) - top), 4)] for p in splits],
    "The best split Viterbi finds": [[t, " ".join(viterbi(t)[0]), round(viterbi(t)[1], 3)] for t in ["unbelievable", "tokenization", "strawberry", "the cat sat"]],
}))
