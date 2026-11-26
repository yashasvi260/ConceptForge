# Semantic search with the full-precision all-MiniLM-L6-v2 (the page runs a quantized copy in the browser).
from sentence_transformers import SentenceTransformer

docs = [
    "How do I reset my password?", "I forgot my login details", "My card was charged twice",
    "I see a payment I don't recognise", "How do I send money abroad?", "What is the interest rate on my mortgage?",
    "How do I order a new debit card?", "Can I increase my credit card limit?", "Where can I find my account number?",
    "How do I close my savings account?", "What are your branch opening hours?", "How do I set up a direct debit?",
]
queries = ["I can't sign in to my account", "transfer funds to another country", "I was billed two times for one purchase"]

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
D = model.encode(docs, normalize_embeddings=True)
Q = model.encode(queries, normalize_embeddings=True)
print("vector size:", D.shape[1])
for q, scores in zip(queries, Q @ D.T):
    best = scores.argsort()[::-1][:2]
    print(q, "→", [(docs[i], round(float(scores[i]), 3)) for i in best])
