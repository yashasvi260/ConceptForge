import codecs

TOKENS = DATA["byte_tokens"]  # real token byte sequences from GPT-4 (cl100k_base) and GPT-4o (o200k_base)

def naive_stream(tokens):
    """Decode each token on its own, as a careless streaming client would."""
    return [bytes(t["bytes"]).decode("utf-8", errors="replace") for t in tokens]

def safe_stream(tokens):
    """After each token, return only the text that is now complete; hold back unfinished characters."""
    decoder = codecs.getincrementaldecoder("utf-8")()
    out = []
    for t in tokens:
        out.append(decoder.decode(bytes(t["bytes"])))
    return out

robot = TOKENS["🤖"]["o200k_base"]
print("naive:", naive_stream(robot))
print("safe: ", safe_stream(robot))
