ROWS = DATA["languages"]  # real GPT-4o (o200k_base) counts
# Made-up example prices in dollars per million tokens. Real prices change: always use your provider's price sheet.
EXAMPLE_PRICES = {"input": 2.50, "output": 10.00}

def rule_of_thumb(chars):
    """The common estimate: about 4 characters per token."""
    return chars / 4

def error_pct(row):
    """How far the rule of thumb is from the real GPT-4o count, in percent of the real count (rounded)."""
    real = row["o200k_base"]
    return round(100 * (rule_of_thumb(row["chars"]) - real) / real)

def request_cost(input_tokens, output_tokens, prices):
    """Dollars for one request; prices are per million tokens, and input and output are priced separately."""
    return (input_tokens * prices["input"] + output_tokens * prices["output"]) / 1_000_000

for r in ROWS:
    print(f'{r["label"]:<9} estimate {rule_of_thumb(r["chars"]):5.1f}  real {r["o200k_base"]:>3}  error {error_pct(r):>4}%')
print("1,000 in + 500 out:", request_cost(1000, 500, EXAMPLE_PRICES), "dollars at the example prices")
