IDS = DATA["bert_ids"]  # a slice of BERT's real vocabulary: token -> ID

def bert_encode(tokens, ids):
    """Wrap word pieces in [CLS] ... [SEP] and map each to its BERT ID; anything missing becomes [UNK]."""
    return [ids["[CLS]"]] + [ids.get(t, ids["[UNK]"]) for t in tokens] + [ids["[SEP]"]]

print(bert_encode(["the", "river", "bank"], IDS))
print(bert_encode(["un", "##able"], IDS))
