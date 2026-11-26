import numpy as np

def check_translates_word_by_attention(ns):
    H = np.eye(3)
    q = np.array([[2.0, 0.1, 0.0], [0.1, 2.0, 0.3], [0.0, 0.2, 2.0]])
    got = ns["translate"](H, q, ["the", "cat", "sleeps"], {"the": "le", "cat": "chat", "sleeps": "dort"})
    assert got == ["le", "chat", "dort"], f"expected ['le', 'chat', 'dort'], got {got}"

def check_follows_the_attention_not_the_position(ns):
    H = np.eye(3)
    q = np.array([[0.0, 0.0, 3.0], [3.0, 0.0, 0.0]])
    got = ns["translate"](H, q, ["the", "cat", "sleeps"], {"the": "le", "cat": "chat", "sleeps": "dort"})
    assert got == ["dort", "le"], f"queries point at 'sleeps' then 'the', so expected ['dort', 'le'], got {got}"
