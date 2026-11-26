IDS = DATA["bert_ids"]  # a slice of BERT's real vocabulary: token -> ID

def bert_encode(tokens, ids):
    """Wrap word pieces in [CLS] ... [SEP] and map each to its BERT ID; anything missing becomes [UNK]."""
    # TODO: start with ids["[CLS]"], add each token's ID (or ids["[UNK]"]), end with ids["[SEP]"]
    return []

print(bert_encode(["the", "river", "bank"], IDS))
print(bert_encode(["un", "##able"], IDS))
