# Worked example for "Bytes: never an unknown token": UTF-8 byte counts, and one emoji cut by two real tokenizers.
import json

chars = ["a", "é", "न", "你", "🤖"]
per_char = [[c, f"U+{ord(c):04X}", " ".join(str(b) for b in c.encode("utf-8")), len(c.encode("utf-8"))] for c in chars]

def show(tokens):
    return " | ".join(" ".join(str(b) for b in t["bytes"]) for t in tokens)

def whole(tokens):
    ok = 0
    for t in tokens:
        try:
            bytes(t["bytes"]).decode("utf-8")
            ok += 1
        except UnicodeDecodeError:
            pass
    return f"{ok} of {len(tokens)}"

robot = DATA["tokens"]["byte_tokens"]["🤖"]
print(json.dumps({
    "UTF-8 bytes per character": per_char,
    "One emoji, cut by two real tokenizers": [
        ["GPT-4 (cl100k_base)", len(robot["cl100k_base"]), show(robot["cl100k_base"]), whole(robot["cl100k_base"])],
        ["GPT-4o (o200k_base)", len(robot["o200k_base"]), show(robot["o200k_base"]), whole(robot["o200k_base"])],
    ],
}))
