def utf8_encode(code_point):
    """UTF-8 bytes for one Unicode code point, from the bit layout:
    < 0x80:     0xxxxxxx
    < 0x800:    110xxxxx 10xxxxxx
    < 0x10000:  1110xxxx 10xxxxxx 10xxxxxx
    otherwise:  11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
    Each continuation byte carries 6 bits: 0x80 | (bits & 0x3F)."""
    if code_point < 0x80:
        return [code_point]
    if code_point < 0x800:
        return [0xC0 | (code_point >> 6), 0x80 | (code_point & 0x3F)]
    if code_point < 0x10000:
        return [0xE0 | (code_point >> 12), 0x80 | ((code_point >> 6) & 0x3F), 0x80 | (code_point & 0x3F)]
    return [0xF0 | (code_point >> 18), 0x80 | ((code_point >> 12) & 0x3F), 0x80 | ((code_point >> 6) & 0x3F), 0x80 | (code_point & 0x3F)]

for ch in ["a", "é", "न", "你", "🤖"]:
    print(ch, hex(ord(ch)), utf8_encode(ord(ch)), list(ch.encode("utf-8")))
