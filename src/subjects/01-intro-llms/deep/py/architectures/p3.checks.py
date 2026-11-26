SENT = "the cat sat on the mat".split()

def check_decoder_gets_one_example_per_position(ns):
    ex = ns["decoder_examples"](SENT)
    assert len(ex) == 5, f"6 tokens give 5 (context, next) pairs, got {len(ex)}"
    assert ex[0] == (["the"], "cat") and ex[-1] == (["the", "cat", "sat", "on", "the"], "mat"), f"first and last pairs are wrong: {ex[:1]} … {ex[-1:]}"

def check_masked_lm_hides_and_remembers(ns):
    masked, labels = ns["masked_lm_example"](SENT, [2, 5])
    assert masked == ["the", "cat", "[MASK]", "on", "the", "[MASK]"], f"got {masked}"
    assert labels == {2: "sat", 5: "mat"}, f"labels should be {{2: 'sat', 5: 'mat'}}, got {labels}"
    assert SENT == "the cat sat on the mat".split(), "don't modify the input list"
