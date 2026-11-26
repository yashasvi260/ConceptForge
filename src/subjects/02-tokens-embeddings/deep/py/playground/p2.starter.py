import re

def split_digits(text):
    """GPT-4-style number handling: runs of digits are cut into chunks of at most 3, from the left;
    every other character is its own piece here."""
    # TODO: re.findall with a pattern for "1 to 3 digits" or "any single non-digit"
    return []

for t in ["1234567", "2026", "3.14159", "1000", "10000"]:
    print(t, split_digits(t))
