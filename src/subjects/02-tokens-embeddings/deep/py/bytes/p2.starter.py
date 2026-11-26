def bytes_to_unicode():
    """GPT-2's printable stand-in for each of the 256 bytes.
    Bytes that are already visible characters (! to ~, ¡ to ¬, ® to ÿ) stand for themselves;
    every other byte (space, newline, control bytes …) gets chr(256 + n), n = 0, 1, 2, … in byte order."""
    visible = list(range(ord("!"), ord("~") + 1)) + list(range(ord("¡"), ord("¬") + 1)) + list(range(ord("®"), ord("ÿ") + 1))
    mapping = {b: chr(b) for b in visible}
    # TODO: give each remaining byte (0..255, in order) the next character from 256 upwards
    return mapping

def visible(text):
    """How a GPT-2-style vocabulary file prints this text: each UTF-8 byte replaced by its stand-in."""
    b2u = bytes_to_unicode()
    return "".join(b2u[b] for b in text.encode("utf-8"))

print(len(bytes_to_unicode()), "of 256 bytes have a stand-in")
