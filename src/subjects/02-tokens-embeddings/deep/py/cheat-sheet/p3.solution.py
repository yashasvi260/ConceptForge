import re

def words(text):
    return set(re.findall(r"[a-z0-9']+", text.lower()))

def keyword_rank(query, docs, gold):
    """Rank documents by word overlap with the query (Jaccard: shared words / all words), Module 01 style.
    Ties keep document order. Return the 1-based rank of the gold document."""
    q = words(query)
    scores = [len(q & words(d)) / len(q | words(d)) for d in docs]
    order = sorted(range(len(docs)), key=lambda i: -scores[i])
    return order.index(gold) + 1

kw = [keyword_rank(q, DOCS, g) for q, g in zip(QUERIES, GOLD)]
emb = [rank_of(qv, D, g) for qv, g in zip(Q, GOLD)]
print("keyword ranks:  ", kw, " hit@1 %.3f  hit@3 %.3f  MRR %.3f" % evaluate(kw))
print("embedding ranks:", emb, " hit@1 %.3f  hit@3 %.3f  MRR %.3f" % evaluate(emb))
