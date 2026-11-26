def check_password_question_finds_the_login_sentences(ns):
    got = [s for _, s in ns["nearest"]("How do I reset my password?", 2)]
    assert got == ["I forgot my login details", "I can't sign in to my account"], f"top 2 should be the two login sentences, got {got}"

def check_card_charge_finds_the_unrecognised_payment(ns):
    got = ns["nearest"]("My card was charged twice", 1)
    assert got and got[0][1] == "I see a payment I don't recognise", f"no shared words, but the closest meaning; got {got}"

def check_never_returns_the_query_itself(ns):
    got = [s for _, s in ns["nearest"]("Dog bites man", 13)]
    assert "Dog bites man" not in got and len(got) == 13, "exclude the query; there are 13 other sentences"
