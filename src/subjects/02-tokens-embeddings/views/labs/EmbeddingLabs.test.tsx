import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  CosBaselineLab,
  HybridLab,
  IndexCostLab,
  PipelineTraceLab,
  PoolMaskLab,
  RetrievalEvalLab,
  ScoreTrapsLab,
  SparseGradLab,
  TableMemoryLab,
  chunksPerDoc,
  jaccard,
} from "./EmbeddingLabs";

const slider = (name: RegExp) => screen.getByRole("slider", { name });

describe("Module 02 embedding labs", () => {
  it("Sparse gradient: 7 positions touch 6 of BERT's 30,522 rows; the two `the`s add up", async () => {
    render(<SparseGradLab />);
    const s = await screen.findByText(/positions touch/);
    expect(s).toHaveTextContent("7 positions touch 6 of 30,522 rows");
    expect(s).toHaveTextContent("Row 1,996 (the) appears 2 times: its updates add up to 2");
    await userEvent.click(screen.getByRole("switch", { name: /Accumulate repeats/ }));
    expect(screen.getByRole("status")).toHaveTextContent("the naive update keeps only 1");
  });

  it("Table memory: MiniLM 46.9 MB in float32; Llama 3 8B 1,050.7 MB in float16", async () => {
    render(<TableMemoryLab />);
    expect(screen.getByRole("status")).toHaveTextContent("MiniLM: 30,522 × 384 = 11,720,448 numbers = 46.9 MB");
    await userEvent.click(screen.getByRole("button", { name: "Llama 3 8B" }));
    await userEvent.click(screen.getByRole("radio", { name: /float16/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Llama 3 8B: 128,256 × 4,096 = 525,336,576 numbers = 1,050.7 MB");
  });

  it("Cosine baseline: different words average 0.072; no threshold separates all six bank pairs", () => {
    render(<CosBaselineLab />);
    expect(screen.getByText(/average/)).toHaveTextContent("30 pairs of different words from two unrelated sentences average 0.072");
    expect(screen.getByRole("status")).toHaveTextContent("Threshold 0.800: 5 of 6 pairs judged correctly.");
    fireEvent.change(slider(/same sense/), { target: { value: "0.9" } });
    expect(screen.getByRole("status")).toHaveTextContent("Threshold 0.900: 5 of 6");
  });

  it("Pool mask: 0.992 with both masks, 0.737 averaging the padding, 0.633 with no attention mask", async () => {
    render(<PoolMaskLab />);
    expect(screen.getByRole("status")).toHaveTextContent("Averaging 7 rows: cosine with the sentence embedded on its own = 0.992");
    await userEvent.click(screen.getByRole("switch", { name: /Mask padding when averaging/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Averaging 22 rows: cosine with the sentence embedded on its own = 0.737");
    await userEvent.click(screen.getByRole("switch", { name: /attention mask/ }));
    expect(screen.getByRole("status")).toHaveTextContent("= 0.633");
  });

  it("Score traps: negation still scores 0.913", async () => {
    render(<ScoreTrapsLab />);
    await userEvent.click(screen.getByRole("button", { name: "Reveal: negation" }));
    expect(screen.getByText("0.913")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("1 of 6 revealed.");
  });

  it("Pipeline trace: the normalised average equals MiniLM's sentence vector, and search finds the login question", async () => {
    render(<PipelineTraceLab />);
    expect(screen.getByRole("status")).toHaveTextContent("[CLS] i forgot my log ##in details [SEP]");
    const next = screen.getByRole("button", { name: /Next stage/ });
    for (let i = 0; i < 4; i++) await userEvent.click(next);
    expect(screen.getByRole("status")).toHaveTextContent("cosine with MiniLM's own sentence vector 1.000");
    await userEvent.click(next);
    expect(screen.getByRole("status")).toHaveTextContent("nearest help question: “I forgot my login details”");
  });

  it("Index cost: 1,000-token documents in 200-token chunks with 50 overlap make 7 chunks each", () => {
    expect(chunksPerDoc(1000, 200, 50)).toBe(7);
    expect(chunksPerDoc(150, 200, 50)).toBe(1);
    render(<IndexCostLab />);
    expect(screen.getByRole("status")).toHaveTextContent("700,000 chunks to embed once; 1.08 GB of float32 vectors; a full scan does 268,800,000 multiply-adds per query.");
  });

  it("Retrieval eval: embeddings MRR 0.917, keywords 0.456; accepting the reset answer gives 1.000", async () => {
    expect(jaccard("How do I", "how do you")).toBeCloseTo(2 / 4);
    render(<RetrievalEvalLab />);
    expect(screen.getByRole("status")).toHaveTextContent("hit@1 = 0.833, MRR = 0.917");
    await userEvent.click(screen.getByRole("switch", { name: /reset my password/ }));
    expect(screen.getByRole("status")).toHaveTextContent("hit@1 = 1.000, MRR = 1.000");
    await userEvent.click(screen.getByRole("switch", { name: /reset my password/ }));
    await userEvent.click(screen.getByRole("radio", { name: "Keyword overlap" }));
    expect(screen.getByRole("status")).toHaveTextContent("hit@1 = 0.167, MRR = 0.456");
  });

  it("Hybrid: embeddings alone miss E2091; α = 0.7 gets every code and 5/6 banking queries; α = 0.8 loses banking", () => {
    render(<HybridLab />);
    expect(screen.getByRole("status")).toHaveTextContent("error codes 2/3 right at rank 1; paraphrased banking queries 5/6");
    fireEvent.change(slider(/Keyword weight/), { target: { value: "0.7" } });
    expect(screen.getByRole("status")).toHaveTextContent("error codes 3/3 right at rank 1; paraphrased banking queries 5/6");
    fireEvent.change(slider(/Keyword weight/), { target: { value: "0.8" } });
    expect(screen.getByRole("status")).toHaveTextContent("banking queries 3/6");
  });
});
