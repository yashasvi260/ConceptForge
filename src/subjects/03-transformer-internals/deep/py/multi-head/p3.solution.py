import numpy as np
AB = DATA["gpt2"]["head_ablation"]
LOSS_UP = np.array(AB["loss_increase"])    # real: how much GPT-2's loss rises when one head is switched off

def most_important(loss_up):
    """(layer, head) whose removal raises the loss the most."""
    loss_up = np.asarray(loss_up)
    l, h = np.unravel_index(np.argmax(loss_up), loss_up.shape)
    return (int(l), int(h))

def count_below(loss_up, threshold):
    """How many heads can be removed one at a time while raising the loss by less than `threshold`."""
    return int((np.asarray(loss_up) < threshold).sum())

print(most_important(LOSS_UP), count_below(LOSS_UP, 0.01), "of", LOSS_UP.size)
