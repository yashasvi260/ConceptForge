# Worked example for "Quirks, cost and context limits": the 4-characters-per-token rule of thumb against
# real GPT-4o counts, and what chunk size and overlap do to a 1,000-token document.
import json

rows = []
for l in DATA["tokens"]["languages"]:
    est = l["chars"] / 4
    real = l["o200k_base"]
    rows.append([l["label"], l["chars"], est, real, round(100 * (est - real) / real)])

def chunk(ids, size, overlap):
    out, start = [], 0
    while True:
        out.append(ids[start:start + size])
        if start + size >= len(ids):
            return out
        start += size - overlap

doc = list(range(1000))
chunks = []
for size, overlap in [(200, 0), (200, 50), (500, 0), (500, 100)]:
    c = chunk(doc, size, overlap)
    chunks.append([size, overlap, len(c), sum(len(x) for x in c)])

print(json.dumps({
    "The 4-characters rule of thumb vs real GPT-4o counts": rows,
    "Chunking a 1,000-token document": chunks,
}))
