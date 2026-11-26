def check_hello_world(ns):
    pieces, lp = ns["viterbi"]("hello world")
    assert pieces == ["▁hello", "▁world"] and abs(lp - (-9.5699)) < 1e-3, f"expected (['▁hello', '▁world'], -9.570), got {(pieces, lp)}"

def check_longer_words(ns):
    got = [ns["viterbi"](t)[0] for t in ["unbelievable", "tokenization"]]
    want = [["▁unbeliev", "able"], ["▁token", "ization"]]
    assert got == want, f"expected {want}, got {got}"

def check_whole_sentence_and_lossless(ns):
    pieces, lp = ns["viterbi"]("the cat sat on the mat")
    assert pieces == ["▁the", "▁cat", "▁sat", "▁on", "▁the", "▁mat"], f"got {pieces}"
    assert abs(lp - (-26.4211)) < 1e-3, f"log-probability should be -26.421, got {lp}"
    assert "".join(pieces).replace("▁", " ").strip() == "the cat sat on the mat", "joining pieces and turning ▁ into spaces must restore the text"
