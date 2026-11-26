ROWS = DATA["languages"]  # real GPT-4 (cl100k_base) and GPT-4o (o200k_base) counts for six texts

def saving_pct(row):
    """Percent fewer tokens with GPT-4o than with GPT-4 for this text."""
    return 100 * (row["cl100k_base"] - row["o200k_base"]) / row["cl100k_base"]

def biggest_saving(rows):
    """Label of the text that gains most from GPT-4o's larger vocabulary."""
    return max(rows, key=saving_pct)["label"]

for r in ROWS:
    print(f'{r["label"]:<9} GPT-4 {r["cl100k_base"]:>3}  GPT-4o {r["o200k_base"]:>3}  saving {saving_pct(r):5.1f}%')
