import type { ChallengeItem } from "../../core/types";

export const challenges: ChallengeItem[] = [
  {
    id: "why-cluster",
    prompt: "You have 50,000 survey comments and no categories. Which approach fits first?",
    options: ["Train a classification head", "Cluster the embeddings to discover the topics", "Zero-shot with label descriptions", "Count the most common words overall"],
    correctIndex: 1,
    hint: "You don't know the labels yet.",
    explanation: "With no labels, clustering finds the groups; you can later name them and even turn them into labels for a classifier.",
    relatedStepId: "no-labels",
  },
  {
    id: "why-umap",
    prompt: "Why does BERTopic reduce the 384-dimensional vectors with UMAP before clustering?",
    options: ["To make the vectors more accurate", "In high dimensions distances bunch together, which makes density hard to measure", "HDBSCAN only accepts 2 numbers", "To remove stop-words"],
    correctIndex: 1,
    hint: "Look at the similarity histogram.",
    explanation: "Distances concentrate in high dimensions; a low-dimensional projection that keeps neighbours together gives density clustering clearer contrast.",
    relatedStepId: "why-reduce",
  },
  {
    id: "min-cluster-size",
    prompt: "Your clustering produces 40 tiny topics. Which change gives fewer, broader topics?",
    options: ["Lower min_cluster_size", "Raise min_cluster_size", "Lower the outlier threshold", "Use more stop-words"],
    correctIndex: 1,
    hint: "It's the granularity knob.",
    explanation: "min_cluster_size is the smallest group HDBSCAN will call a cluster: raising it merges small groups into broader ones.",
    relatedStepId: "hdbscan",
  },
  {
    id: "outliers",
    prompt: "HDBSCAN labels a comment −1. What does that mean?",
    options: ["It's the most important comment", "It's an outlier: no cluster is dense enough around it", "It belongs to the first cluster", "The embedding failed"],
    correctIndex: 1,
    hint: "Density methods don't force every point into a group.",
    explanation: "−1 is noise: the point sits in a sparse region. Unlike k-means, HDBSCAN is allowed to leave it unassigned.",
    relatedStepId: "density",
  },
  {
    id: "ctfidf-score",
    prompt: "In c-TF-IDF, why does “fee” score high for the fees cluster but “bank” does not?",
    options: ["“bank” is a stop-word", "“fee” is frequent in that cluster and rare in others; “bank” appears everywhere", "“fee” is shorter", "The LLM chose it"],
    correctIndex: 1,
    hint: "Term frequency × inverse frequency across clusters.",
    explanation: "Words common in one cluster but rare overall are distinctive; words spread across all clusters get a low inverse-frequency weight.",
    relatedStepId: "ctfidf",
  },
];
