"""Reference labels from scikit-learn's HDBSCAN for src/subjects/05-clustering-topics/hdbscan.test.ts.

    docker run --rm -v "$PWD":/w -w /w python:3.12-slim sh -c "pip -q install scikit-learn==1.5.2 && python scripts/make-hdbscan-fixture.py"
"""
import json

import numpy as np
from sklearn.cluster import HDBSCAN

rng = np.random.default_rng(7)
blobs = [rng.normal(c, s, size=(n, 2)) for c, s, n in [((0, 0), 0.4, 25), ((5, 5), 0.6, 30), ((0, 6), 0.3, 15), ((6, -1), 1.0, 20)]]
noise = rng.uniform(-3, 9, size=(10, 2))
X = np.round(np.vstack(blobs + [noise]), 4)
cases = []
for mcs, ms in [(5, None), (10, None), (5, 3), (15, None)]:
    model = HDBSCAN(min_cluster_size=mcs, min_samples=ms).fit(X)
    cases.append({"minClusterSize": mcs, "minSamples": ms, "labels": model.labels_.tolist()})
json.dump({"points": X.tolist(), "cases": cases, "sklearn": __import__("sklearn").__version__},
          open("src/subjects/05-clustering-topics/data/hdbscan-reference.json", "w"))
print("cases", [(c["minClusterSize"], c["minSamples"], max(c["labels"]) + 1, c["labels"].count(-1)) for c in cases])
