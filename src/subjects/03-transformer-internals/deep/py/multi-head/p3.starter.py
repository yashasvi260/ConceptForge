import numpy as np
AB = DATA["gpt2"]["head_ablation"]
LOSS_UP = np.array(AB["loss_increase"])    # real: how much GPT-2's loss rises when one head is switched off

def most_important(loss_up):
    """(layer, head) whose removal raises the loss the most."""
    # TODO: np.unravel_index(np.argmax(...), shape)
    return (0, 0)

def count_below(loss_up, threshold):
    """How many heads can be removed one at a time while raising the loss by less than `threshold`."""
    # TODO
    return 0

print(most_important(LOSS_UP), count_below(LOSS_UP, 0.01), "of", LOSS_UP.size)
