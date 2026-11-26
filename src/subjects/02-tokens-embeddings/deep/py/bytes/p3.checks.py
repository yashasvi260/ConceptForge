TOKENS = DATA["byte_tokens"]

def check_gpt4o_robot_arrives_on_the_second_token(ns):
    got = ns["safe_stream"](TOKENS["🤖"]["o200k_base"])
    assert got == ["", "🤖"], f"GPT-4o sends 🤖 as 2 tokens; nothing is complete until the second: ['', '🤖'], got {got}"

def check_gpt4_robot_needs_three_tokens(ns):
    got = ns["safe_stream"](TOKENS["🤖"]["cl100k_base"])
    assert got == ["", "", "🤖"], f"GPT-4 sends 🤖 as 3 tokens: ['', '', '🤖'], got {got}"

def check_hindi_streams_back_to_the_exact_text(ns):
    toks = TOKENS["आज मौसम"]["cl100k_base"]
    got = ns["safe_stream"](toks)
    assert "".join(got) == "आज मौसम", f"the pieces must join back to 'आज मौसम', got {''.join(got)!r}"
    assert "�" not in "".join(got), "no replacement characters (�) should appear"
