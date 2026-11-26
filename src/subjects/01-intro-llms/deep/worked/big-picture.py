# Worked example for "What a language model does": bigram counts and probabilities.
# Prints JSON {caption: rows}; the lesson's tables must match it exactly (checked in tests).
import json

text = "the cat sat on the mat . the cat ate the fish . the dog sat on the rug ."
tokens = text.split()

counts = {}
for prev, nxt in zip(tokens, tokens[1:]):
    counts.setdefault(prev, {})
    counts[prev][nxt] = counts[prev].get(nxt, 0) + 1

after_the = counts["the"]
total = sum(after_the.values())
rows = [[w, c, f"{c}/{total}", round(c / total, 3)] for w, c in after_the.items()]

# Greedy generation from "the": always take the most frequent follower (ties: first seen).
out = ["the"]
for _ in range(7):
    followers = counts[out[-1]]
    out.append(max(followers, key=followers.get))

steps = []
for prev, nxt in zip(out, out[1:]):
    f = counts[prev]
    steps.append([prev, ", ".join(f"{w} {c}" for w, c in f.items()), nxt])

print(json.dumps({
    "What follows “the” in the training text": rows,
    "Greedy generation, one token at a time": steps,
}))
