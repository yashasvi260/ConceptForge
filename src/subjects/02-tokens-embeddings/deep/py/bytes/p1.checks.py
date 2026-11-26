def check_two_byte_characters(ns):
    got = ns["utf8_encode"](ord("é"))
    assert got == [195, 169], f"é (U+00E9) is [195, 169], got {got}"

def check_three_byte_characters(ns):
    got = (ns["utf8_encode"](ord("न")), ns["utf8_encode"](ord("你")))
    assert got == ([224, 164, 168], [228, 189, 160]), f"न → [224, 164, 168], 你 → [228, 189, 160]; got {got}"

def check_four_byte_emoji(ns):
    got = ns["utf8_encode"](ord("🤖"))
    assert got == [240, 159, 164, 150], f"🤖 (U+1F916) is [240, 159, 164, 150], got {got}"

def check_matches_python_on_a_whole_sentence(ns):
    text = "Café नमस्ते 你好 🤖!"
    got = [b for ch in text for b in ns["utf8_encode"](ord(ch))]
    assert got == list(text.encode("utf-8")), "your bytes for the whole sentence should equal text.encode('utf-8')"
