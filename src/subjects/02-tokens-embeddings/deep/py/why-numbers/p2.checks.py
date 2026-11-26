ROWS = DATA["languages"]
BY = {r["label"]: r for r in ROWS}

def check_chars_per_token(ns):
    got = ns["chars_per_token"](BY["English"], "o200k_base")
    assert abs(got - 52 / 12) < 1e-9, f"English with GPT-4o: 52 characters / 12 tokens = 4.33, got {got}"

def check_hindi_token_tax_with_gpt4(ns):
    got = ns["token_tax"](ROWS, "Hindi", "cl100k_base")
    assert abs(got - 45 / 13) < 1e-9, f"GPT-4: Hindi 45 tokens / English 13 = 3.46, got {got}"

def check_gpt4o_shrinks_the_tax(ns):
    old, new = ns["token_tax"](ROWS, "Hindi", "cl100k_base"), ns["token_tax"](ROWS, "Hindi", "o200k_base")
    assert abs(new - 14 / 12) < 1e-9, f"GPT-4o: Hindi 14 tokens / English 12 = 1.17, got {new}"
    assert new < old, "the larger GPT-4o vocabulary should tax Hindi less than GPT-4's"

def check_english_tax_is_one(ns):
    got = ns["token_tax"](ROWS, "English", "o200k_base")
    assert got == 1, f"English compared with itself is 1, got {got}"
