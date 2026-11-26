import re

GENERAL = """The cat sat on the mat. The dog sat on the rug. The cat ate the fish.
The dog ate the bone. A bird sat on the tree. The bird ate the seed."""
BANKING = """The bank approved the loan. The customer repaid the loan. The bank froze the card.
The customer reported the card. The bank refunded the payment."""
HELD_OUT = "The bank approved the payment. The customer froze the card."

def tokenize(text):
    """Lowercase; words and the punctuation marks . , ! ? become tokens."""
    return re.findall(r"[a-z']+|[.,!?]", text.lower())

print(tokenize("The cat sat. The dog ate!"))
