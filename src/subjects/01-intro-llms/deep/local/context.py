# Static vs contextual vectors for "bank", straight from the model's layers.
import torch
from transformers import AutoModel, AutoTokenizer

name = "sentence-transformers/all-MiniLM-L6-v2"
tok, model = AutoTokenizer.from_pretrained(name), AutoModel.from_pretrained(name)
sentences = ["I deposited cash at the bank", "The river bank flooded", "We had a picnic on the river bank"]

def bank_vectors(text):
    enc = tok(text, return_tensors="pt")
    i = enc.input_ids[0].tolist().index(tok.convert_tokens_to_ids("bank"))
    with torch.no_grad():
        out = model(**enc)
    static = model.embeddings.word_embeddings.weight[enc.input_ids[0, i]]   # the lookup-table row
    return static, out.last_hidden_state[0, i]                              # after all 6 blocks

vecs = [bank_vectors(s) for s in sentences]
cos = torch.nn.functional.cosine_similarity
for a in range(3):
    for b in range(a + 1, 3):
        s, c = cos(vecs[a][0], vecs[b][0], dim=0), cos(vecs[a][1], vecs[b][1], dim=0)
        print(f"{sentences[a]!r} vs {sentences[b]!r}\n    static {s:.3f}   contextual {c:.3f}")
