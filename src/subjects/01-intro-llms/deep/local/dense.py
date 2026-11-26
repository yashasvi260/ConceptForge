# Dense sentence embeddings with the same model this page uses (full precision here).
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
sentences = ["The film was great", "The movie was excellent", "Interest rates rose today", "Dog bites man", "Man bites dog"]

emb = model.encode(sentences, normalize_embeddings=True)   # one 384-number vector per sentence, length 1
print("shape:", emb.shape)

sims = emb @ emb.T                                          # cosine similarity of every pair
for s, row in zip(sentences, sims):
    print(f"{s:<26}", " ".join(f"{x:5.2f}" for x in row))
