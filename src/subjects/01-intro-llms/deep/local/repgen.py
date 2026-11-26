# The same ticket, two ways: a vector classifier (MiniLM) and a generative model (gemma4:12b via Ollama).
import json, os, urllib.request
from sentence_transformers import SentenceTransformer

ticket = "I can't sign in to my account"
examples = {
    "login": ["How do I reset my password?", "I forgot my login details"],
    "payments": ["My card was charged twice"],
    "movies": ["The film was great"],
}

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
v = model.encode(ticket, normalize_embeddings=True)
for label, texts in examples.items():
    c = model.encode(texts, normalize_embeddings=True).mean(axis=0)
    print(f"{label:<9} cosine {float(v @ c / (c @ c) ** 0.5):.3f}")

url = os.environ.get("OLLAMA_URL", "http://localhost:11434")
body = {
    "model": "gemma4:12b",
    "prompt": f"Classify this support ticket as login, payments or movies. Answer with one word.\nTicket: {ticket}",
    "stream": False,
    "think": False,
    "options": {"num_ctx": 32768, "temperature": 0},
}
req = urllib.request.Request(f"{url}/api/generate", json.dumps(body).encode(), {"Content-Type": "application/json"})
reply = json.load(urllib.request.urlopen(req))
print("gemma4:12b says:", reply["response"].strip())
print("tokens read:", reply["prompt_eval_count"], " tokens written:", reply["eval_count"])
