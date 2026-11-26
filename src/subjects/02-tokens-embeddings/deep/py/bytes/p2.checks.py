def check_every_byte_has_its_own_character(ns):
    m = ns["bytes_to_unicode"]()
    assert sorted(m) == list(range(256)), "all 256 byte values need a stand-in"
    assert len(set(m.values())) == 256, "stand-ins must all be different, or decoding would be ambiguous"

def check_space_is_shown_as_G_with_a_dot(ns):
    got = ns["visible"](" the")
    assert got == "Ġthe", f"a leading space (byte 32) prints as 'Ġ' (chr(288)): 'Ġthe', got {got!r}"

def check_newline_and_letters(ns):
    m = ns["bytes_to_unicode"]()
    assert m[10] == "Ċ", f"newline (byte 10) prints as 'Ċ' (chr(266)), got {m[10]!r}"
    assert m[ord("a")] == "a", "visible bytes such as 'a' stand for themselves"
