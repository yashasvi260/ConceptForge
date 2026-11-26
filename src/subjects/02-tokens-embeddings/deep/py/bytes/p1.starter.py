def utf8_encode(code_point):
    """UTF-8 bytes for one Unicode code point, from the bit layout:
    < 0x80:     0xxxxxxx
    < 0x800:    110xxxxx 10xxxxxx
    < 0x10000:  1110xxxx 10xxxxxx 10xxxxxx
    otherwise:  11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
    Each continuation byte carries 6 bits: 0x80 | (bits & 0x3F)."""
    if code_point < 0x80:
        return [code_point]
    # TODO: the 2-, 3- and 4-byte cases (use >> 6, >> 12, >> 18 and & 0x3F)
    return []

for ch in ["a", "é", "न", "你", "🤖"]:
    print(ch, hex(ord(ch)), utf8_encode(ord(ch)), list(ch.encode("utf-8")))
