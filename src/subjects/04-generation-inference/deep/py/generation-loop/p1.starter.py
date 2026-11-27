# A made-up "model" (not a real one): it counts up from the last token and says <eos> (id 0) after 9.
EOS = 0
def next_token(ids):
    return EOS if ids[-1] >= 9 else ids[-1] + 1

def generate(next_token, prompt_ids, max_new_tokens, eos_id):
    """Run the loop: ask for the next token, append it, repeat. Stop at eos (not included) or after max_new_tokens.
    Return only the NEW tokens."""
    ids = list(prompt_ids)
    new = []
    # TODO
    return new

print(generate(next_token, [3, 4], 10, EOS), generate(next_token, [3, 4], 2, EOS))
