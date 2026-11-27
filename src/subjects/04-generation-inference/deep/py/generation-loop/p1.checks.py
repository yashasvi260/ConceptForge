EOS = 0
def counter(ids):
    return EOS if ids[-1] >= 9 else ids[-1] + 1

def check_stops_at_eos(ns):
    got = ns["generate"](counter, [3, 4], 10, EOS)
    assert got == [5, 6, 7, 8, 9], f"counts 5…9, then the model says <eos>, which ends the loop and isn't returned; got {got}"

def check_max_new_tokens(ns):
    got = ns["generate"](counter, [3, 4], 2, EOS)
    assert got == [5, 6], f"max_new_tokens = 2 stops after two tokens even without <eos>; got {got}"
    assert ns["generate"](counter, [9], 5, EOS) == [], "if the first prediction is <eos>, nothing is generated"

def check_model_sees_its_own_output(ns):
    seen = []
    def spy(ids):
        seen.append(list(ids))
        return 1
    ns["generate"](spy, [7], 3, EOS)
    assert seen == [[7], [7, 1], [7, 1, 1]], f"each step feeds the prompt plus everything generated so far; got {seen}"
