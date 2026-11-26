import math

def cross_entropy(p_correct):
    """The loss for one prediction: minus the log of the probability given to the right token."""
    return -math.log(p_correct)

for p in (0.179, 0.5, 0.9, 0.99):
    print(p, round(cross_entropy(p), 3))
