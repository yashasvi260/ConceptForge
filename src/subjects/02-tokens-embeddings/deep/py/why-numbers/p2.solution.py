ROWS = DATA["languages"]

def chars_per_token(row, encoding):
    """How many characters one token covers on average (higher = more efficient)."""
    return row["chars"] / row[encoding]

def token_tax(rows, label, encoding):
    """Tokens for this language's sentence divided by tokens for the English one, with the same tokenizer."""
    by = {r["label"]: r for r in rows}
    return by[label][encoding] / by["English"][encoding]

for enc in ("cl100k_base", "o200k_base"):
    print(enc, {r["label"]: round(token_tax(ROWS, r["label"], enc), 2) for r in ROWS[:4]})
