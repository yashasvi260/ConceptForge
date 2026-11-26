ROWS = DATA["languages"]

def chars_per_token(row, encoding):
    """How many characters one token covers on average (higher = more efficient)."""
    # TODO: row["chars"] divided by the token count for this encoding ("cl100k_base" or "o200k_base")
    return 0.0

def token_tax(rows, label, encoding):
    """Tokens for this language's sentence divided by tokens for the English one, with the same tokenizer."""
    # TODO: find the row with this label and the English row, divide their token counts
    return 0.0

for enc in ("cl100k_base", "o200k_base"):
    print(enc, {r["label"]: round(token_tax(ROWS, r["label"], enc), 2) for r in ROWS[:4]})
