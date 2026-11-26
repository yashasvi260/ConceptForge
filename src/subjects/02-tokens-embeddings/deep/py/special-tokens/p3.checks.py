BATCH = [[101, 1996, 2924, 102], [101, 1996, 2314, 2924, 13893, 102], [101, 102]]

def check_padding_and_masks(ns):
    ids, masks = ns["pad_batch"](BATCH, 5)
    assert ids[0] == [101, 1996, 2924, 102, 0] and masks[0] == [1, 1, 1, 1, 0], f"short row: pad with 0 and mask it out; got {ids[0]}, {masks[0]}"
    assert ids[2] == [101, 102, 0, 0, 0] and masks[2] == [1, 1, 0, 0, 0], f"got {ids[2]}, {masks[2]}"

def check_truncation_keeps_sep(ns):
    ids, masks = ns["pad_batch"](BATCH, 5)
    assert ids[1] == [101, 1996, 2314, 2924, 102], f"cut to 5 but keep [SEP]=102 last: [101, 1996, 2314, 2924, 102], got {ids[1]}"
    assert masks[1] == [1, 1, 1, 1, 1], f"no padding in a truncated row, got {masks[1]}"

def check_every_row_has_the_same_length(ns):
    ids, masks = ns["pad_batch"](BATCH, 7)
    assert all(len(r) == 7 for r in ids) and all(len(m) == 7 for m in masks), "every row and mask must be exactly max_len long"
