import math

# A made-up next-token table (not a real model): which tokens can follow a sequence, and how likely each is.
TABLE = {
    ("A",): {"B": 0.5, "C": 0.4, "D": 0.1},
    ("A", "B"): {"x": 0.3, "y": 0.3, "z": 0.4},
    ("A", "C"): {"x": 0.9, "y": 0.1},
    ("A", "D"): {"x": 1.0},
}
def next_logprobs(seq):
    return {t: math.log(p) for t, p in TABLE.get(tuple(seq), {}).items()}

def beam_search(next_logprobs, start, steps, width):
    """Keep the `width` best partial sequences by total log-probability; extend each by every next token; repeat."""
    beams = [(list(start), 0.0)]
    for _ in range(steps):
        # TODO: extend every beam by every token, then keep the `width` highest totals
        pass
    return beams[0]

print(beam_search(next_logprobs, ["A"], 2, 1), beam_search(next_logprobs, ["A"], 2, 2))
