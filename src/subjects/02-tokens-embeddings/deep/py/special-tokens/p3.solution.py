BERT = DATA["bert"]  # [PAD]=0, [UNK]=100, [CLS]=101, [SEP]=102, [MASK]=103

def pad_batch(batch, max_len):
    """Make every sequence exactly max_len long, as one batch tensor needs:
    - too long: cut it, but keep [SEP] as the last token;
    - too short: append [PAD] (0).
    Also return attention masks: 1 for real tokens, 0 for padding."""
    ids, masks = [], []
    for seq in batch:
        if len(seq) > max_len:
            seq = seq[: max_len - 1] + [BERT["[SEP]"]]
        pad = max_len - len(seq)
        ids.append(seq + [BERT["[PAD]"]] * pad)
        masks.append([1] * len(seq) + [0] * pad)
    return ids, masks

batch = [[101, 1996, 2924, 102], [101, 1996, 2314, 2924, 13893, 102], [101, 102]]
ids, masks = pad_batch(batch, 5)
for row, m in zip(ids, masks):
    print(row, m)
