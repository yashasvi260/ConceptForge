import math
TABLE = {
    ("A",): {"B": 0.5, "C": 0.4, "D": 0.1},
    ("A", "B"): {"x": 0.3, "y": 0.3, "z": 0.4},
    ("A", "C"): {"x": 0.9, "y": 0.1},
    ("A", "D"): {"x": 1.0},
}
nl = lambda seq: {t: math.log(p) for t, p in TABLE.get(tuple(seq), {}).items()}

def check_width_one_is_greedy(ns):
    seq, score = ns["beam_search"](nl, ["A"], 2, 1)
    assert seq == ["A", "B", "z"], f"width 1 is greedy: A → B (0.5) → z (0.4); got {seq}"
    assert abs(score - math.log(0.2)) < 1e-9, "its total is log(0.5 · 0.4) = log 0.2"

def check_beam_beats_greedy(ns):
    seq, score = ns["beam_search"](nl, ["A"], 2, 2)
    assert seq == ["A", "C", "x"], f"with 2 beams, A → C → x wins: 0.4 · 0.9 = 0.36 beats greedy's 0.2; got {seq}"
    assert abs(math.exp(score) - 0.36) < 1e-9, "its total probability is 0.36"
