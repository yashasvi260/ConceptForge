# Worked example for "Real tokenizers: languages, code and numbers": real GPT-4 and GPT-4o counts and pieces.
import json

langs = DATA["tokens"]["languages"]
en = {e: next(l for l in langs if l["label"] == "English")[e] for e in ("cl100k_base", "o200k_base")}
rows = [[l["label"], l["chars"], l["cl100k_base"], l["o200k_base"], round(l["chars"] / l["o200k_base"], 2),
         round(l["o200k_base"] / en["o200k_base"], 2)] for l in langs]

pieces = DATA["tokens"]["pieces"]
show = lambda t: " | ".join(p["text"] for p in pieces[t]["o200k_base"])
print(json.dumps({
    "Six texts, two real tokenizers": rows,
    "How GPT-4o cuts numbers and one word": [[repr(t), show(t), len(pieces[t]["o200k_base"])] for t in ["1234567", "2026", "3.14159", "strawberry", " strawberry", "STRAWBERRY"]],
}))
