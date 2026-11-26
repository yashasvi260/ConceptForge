import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FamiliesLab, FamilySizesLab, ModelCardLab, ObjectiveLab, TaskFramingLab, maskedExample, nextTokenExamples } from "./ArchLabs";

describe("architecture labs", () => {
  it("next-token examples match the worked example (3 from 'the cat sat down')", () => {
    expect(nextTokenExamples(["the", "cat", "sat", "down"])).toEqual([["the", "cat"], ["the cat", "sat"], ["the cat sat", "down"]]);
  });

  it("masking picks 15% of positions (at least one) and records their true tokens", () => {
    const { input, targets } = maskedExample("a b c d e f g h i j k l m n o p q r s t".split(" "), () => 0.1);
    expect(Object.keys(targets)).toHaveLength(3);
    for (const i of Object.keys(targets)) expect(input[Number(i)]).toBe("[MASK]");
  });

  it("Families: search points to an encoder, chat to a decoder", async () => {
    render(<FamiliesLab />);
    expect(screen.getByRole("status")).toHaveTextContent("Encoder");
    await userEvent.click(screen.getByRole("button", { name: "Chat with users and answer questions" }));
    expect(screen.getByRole("status")).toHaveTextContent("Decoder");
  });

  it("Objectives: next-token gives T−1 examples; span corruption hides a span", async () => {
    render(<ObjectiveLab rand={() => 0.3} />);
    expect(screen.getByRole("status")).toHaveTextContent("8 training examples from one 9-token sentence");
    await userEvent.click(screen.getByRole("radio", { name: "Span corruption (T5)" }));
    expect(screen.getByText(/decoder writes: <X>/)).toBeInTheDocument();
  });

  it("Task framing: translation is a natural decoder prompt", async () => {
    render(<TaskFramingLab />);
    await userEvent.click(screen.getByRole("button", { name: "Translation" }));
    expect(screen.getByText(/Translate to French/)).toBeInTheDocument();
  });

  it("Sizes: shows all six models, with exact counts on hover", () => {
    render(<FamilySizesLab />);
    const bars = within(screen.getByRole("list", { name: "Parameters" })).getAllByRole("listitem");
    expect(bars).toHaveLength(6);
    expect(screen.getByTitle(/124,439,808 parameters/)).toBeInTheDocument();
  });

  it("Model card: Llama 3's tie_word_embeddings is false", async () => {
    render(<ModelCardLab />);
    await userEvent.click(screen.getByRole("radio", { name: "Llama 3 8B" }));
    await userEvent.click(screen.getByRole("button", { name: /tie_word_embeddings/ }));
    expect(screen.getByRole("status")).toHaveTextContent("a separate output head");
  });
});
