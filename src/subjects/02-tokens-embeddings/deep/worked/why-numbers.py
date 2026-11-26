# Worked example for "Why tokens: three ways to chop text": the same sentence cut by spaces, characters,
# UTF-8 bytes and GPT-4o's real tokenizer (counts from DATA["tokens"], generated with js-tiktoken).
import json

rows = [l for l in DATA["tokens"]["languages"] if l["label"] in ("English", "Spanish", "Hindi", "Japanese")]
cut = [[l["label"], len(l["text"].split()), l["chars"], l["utf8_bytes"], l["o200k_base"]] for l in rows]

# A word vocabulary built from a small "training" text, tried on a new sentence.
train = "the cat sat on the mat the dog sat on the log"
test = "the cats sat on the rug"
word_vocab = set(train.split())
char_vocab = set(train.replace(" ", ""))
unknown_words = [w for w in test.split() if w not in word_vocab]
unknown_chars = sorted({c for c in test.replace(" ", "") if c not in char_vocab})

print(json.dumps({
    "The same sentence, cut four ways": cut,
    "A word vocabulary vs a character vocabulary on new text": [
        ["words", len(word_vocab), len(test.split()), len(unknown_words), " ".join(unknown_words)],
        ["characters", len(char_vocab), len(test.replace(" ", "")), len(unknown_chars), " ".join(unknown_chars)],
    ],
}))
