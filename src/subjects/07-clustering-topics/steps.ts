import type { LessonStep } from "../../core/types";

/** Everything is computed live in the browser except the topic names, recorded from gemma4:12b. Sources: docs/research/part2-sources.md */
export const steps: LessonStep[] = [
  {
    id: "no-labels",
    title: "When nobody has labelled the data",
    summary: "Module 06 sorted tickets into categories someone defined. Often you first need to discover what the categories are.",
    body: [
      "A bank collects thousands of comments from surveys, app reviews and chats. Before you can route or count them, you need to know **what people talk about**.",
      "Reading them all doesn't scale. **Topic modelling** groups similar texts automatically and describes each group. No labels needed.",
      "The recipe you'll build is the one behind the popular BERTopic library: embed, reduce, cluster, describe.",
    ],
    tryIt: "Read a few comments and guess the topics before the algorithm does.",
    keyTakeaway: "Clustering finds groups in unlabelled text; topic modelling describes them.",
    view: "intro",
  },
  {
    id: "embed-docs",
    title: "Step 1: embed every comment",
    summary: "The same MiniLM vectors as Modules 02 and 04: comments that mean similar things get nearby vectors.",
    body: [
      "Each comment becomes 384 numbers. Comments about the same thing (a crashing app, a high fee) end up close together, even when they share no words.",
      "Pick a comment on the right to see its nearest neighbours by cosine similarity. That closeness is what clustering will exploit.",
    ],
    tryIt: "Pick a fee complaint and check that its neighbours are about fees too.",
    keyTakeaway: "Embeddings turn “about the same thing” into “close together”.",
    callout: "similarity = cos(vector A, vector B)",
    view: "embed",
  },
  {
    id: "why-reduce",
    title: "Step 2: why squash 384 dimensions",
    summary: "In high dimensions distances bunch up and density is hard to measure, so we first project to a few dimensions.",
    body: [
      "With 384 dimensions, most pairs of comments end up at similar-looking distances: the histogram on the right shows the similarities of all pairs packed into a narrow band. Density-based clustering struggles when “near” and “far” look alike.",
      "So BERTopic first **reduces** the vectors to a handful of dimensions (we use 2 so you can see them), trying to keep neighbours next to each other.",
    ],
    tryIt: "Look at how narrow the middle 80% of similarities is.",
    keyTakeaway: "Reduce dimensions first so density is meaningful (and, in 2-D, visible).",
    view: "curse",
  },
  {
    id: "umap",
    title: "UMAP: a map that keeps neighbours together",
    summary: "UMAP builds a nearest-neighbour graph in 384-D and lays it out in 2-D so that neighbours stay neighbours.",
    body: [
      "**UMAP** (McInnes et al. 2018) connects each point to its nearest neighbours, then arranges the points in 2-D so those connections are kept as well as possible.",
      "**n_neighbors** sets how local the picture is (small = many tight islands, large = broader structure). **min_dist** sets how tightly points may pack.",
      "The colours show the hidden theme each comment was written for. UMAP never sees them, yet the themes form islands.",
    ],
    tryIt: "Drag n_neighbors to 3 and then to 30 and watch the islands change.",
    keyTakeaway: "UMAP projects to 2-D while preserving local neighbourhoods.",
    view: "umap",
  },
  {
    id: "density",
    title: "Clusters are crowded regions",
    summary: "Density clustering calls a region a cluster when points are packed close together, and leaves sparse points out.",
    body: [
      "Instead of asking for “k clusters”, density methods look at how crowded each point's neighbourhood is. The **core distance** of a point is the distance to its k-th nearest neighbour: small means crowded.",
      "Crowded regions separated by sparse gaps become clusters. Points in sparse areas can stay **outliers** rather than being forced into a group.",
    ],
    tryIt: "Spot the big points (dense cores) and the small ones between islands.",
    keyTakeaway: "Density clustering needs no cluster count and can leave outliers out.",
    callout: "core distance = distance to the k-th nearest neighbour",
    view: "density",
  },
  {
    id: "hdbscan",
    title: "HDBSCAN: clusters at every density",
    summary: "HDBSCAN tries every density level and keeps the clusters that stay stable longest; min_cluster_size sets the granularity.",
    body: [
      "**HDBSCAN** (Campello et al. 2013) builds a tree of clusters from loose to tight and keeps the most **stable** ones. Our implementation follows scikit-learn's step by step and is tested against it.",
      "**min_cluster_size** is the smallest group worth calling a cluster: raise it for fewer, broader topics; lower it for many small ones. The **outlier threshold** greys out points whose outlier score (GLOSH) is high, even if HDBSCAN placed them in a cluster.",
      "Add your own comment below and watch where it lands.",
    ],
    tryIt: "Set min_cluster_size to 2, then 12, then lower the outlier threshold.",
    keyTakeaway: "min_cluster_size controls topic granularity; outliers are allowed to stay unassigned.",
    view: "hdbscan",
  },
  {
    id: "ctfidf",
    title: "c-TF-IDF: describing a cluster",
    summary: "Treat each cluster as one big document and score words that are frequent in it but rare elsewhere.",
    body: [
      "A cluster is just a set of points. To understand it, BERTopic uses **class-based TF-IDF**: a word scores high if it is common in this cluster (term frequency) and rare across clusters (inverse frequency).",
      "These keywords come straight from the counting, with no model involved. They change live with your clustering settings.",
    ],
    tryIt: "Change min_cluster_size on the previous step and come back: the keywords follow.",
    keyTakeaway: "c-TF-IDF: words frequent in a cluster and rare in the others describe it.",
    callout: "score(t, c) = tf(t, c) · log(1 + A / f(t))",
    view: "keywords",
  },
  {
    id: "llm-names",
    title: "Naming topics with an LLM",
    summary: "Give a generative model each cluster's keywords and comments and ask for a short name. The names here were recorded from gemma4:12b.",
    body: [
      "Keyword lists are useful but clumsy. BERTopic can pass each cluster's keywords and example documents to an LLM and ask for a readable label.",
      "The names on the right were recorded once from gemma4:12b for the default clustering. Change the settings or add a comment and the clusters change, so there's no recording: connect your own Ollama to name them live.",
    ],
    tryIt: "Add a comment, see the names disappear, and think about why.",
    keyTakeaway: "Clustering finds the groups; an LLM can turn keywords into human-readable topic names.",
    view: "names",
  },
  {
    id: "recap",
    title: "Up next: the prompt itself",
    summary: "You've used LLMs with one-line prompts. Module 08 shows how much the prompt's wording and structure change the answer.",
    body: [
      "You can now discover topics in unlabelled text: embed, reduce, cluster, describe, name.",
      "Twice now (classification and topic naming) a short prompt did the LLM's part. **Module 08** opens up prompt engineering: roles, examples, step-by-step reasoning and structured outputs, measured on real model runs.",
    ],
    tryIt: "Take the practice check, then continue to Module 08.",
    keyTakeaway: "Embed → UMAP → HDBSCAN → c-TF-IDF (→ LLM names) is the BERTopic pipeline.",
    view: "recap",
  },
];
