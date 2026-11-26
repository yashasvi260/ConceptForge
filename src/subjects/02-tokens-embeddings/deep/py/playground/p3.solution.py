import re

# A simplified GPT-style pre-tokenizer, applied before BPE. Alternatives are tried left to right:
#   'll 've 're 's 't 'm 'd   English contractions
#    ?letters                 a word, with the space before it attached
#   digits{1,3}               numbers, at most 3 digits per piece
#    ?other                   runs of punctuation and symbols, with an optional leading space
#   whitespace                anything else
PATTERN = r"'(?:ll|ve|re|[stmd])| ?[^\W\d_]+|\d{1,3}| ?[^\s\w]+|\s+"

def pretokenize(text):
    """Split text into the chunks BPE runs on; BPE never merges across these boundaries."""
    return re.findall(PATTERN, text)

print(pretokenize("I'm paying 1250.75 dollars, OK?"))
