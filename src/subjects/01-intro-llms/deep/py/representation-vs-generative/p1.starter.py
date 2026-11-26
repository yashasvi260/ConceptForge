import numpy as np

vectors = {s: np.array(v) for s, v in DATA["sentences"].items()}
labelled = {
    "login": ["How do I reset my password?", "I forgot my login details"],
    "payments": ["My card was charged twice"],
    "movies": ["The film was great"],
}

def centroid(sentences):
    """The average of the sentences' MiniLM vectors: one point that stands for the whole class."""
    # TODO: np.mean over the stacked vectors, axis=0
    return None

centroids = {label: centroid(s) for label, s in labelled.items()}
print({k: (None if v is None else v.shape) for k, v in centroids.items()})
