import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BridgeLab, CosineLab, KeywordWinsLab, TfIdfLab, WordOrderLab, tfidf } from "./BowLabs";

const setSlider = (name: string, value: string) => {
  const s = screen.getByRole("slider", { name });
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(s, value);
    s.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

describe("bag-of-words labs", () => {
  it("tfidf matches the lesson's example: the = ln(4/2), film = ln(4/1)", () => {
    const t = tfidf(["The film was great", "The movie was excellent", "Dog bites man", "Man bites dog"]);
    expect(t.idf[t.vocab.indexOf("the")]).toBeCloseTo(Math.log(2));
    expect(t.idf[t.vocab.indexOf("film")]).toBeCloseTo(Math.log(4));
  });

  it("Cosine: 90° gives 0 and changing a length changes nothing", () => {
    render(<CosineLab />);
    setSlider("Angle between them", "90");
    expect(screen.getByRole("status")).toHaveTextContent("= 0.000");
    setSlider("Angle between them", "0");
    setSlider("Length of b", "2.5");
    expect(screen.getByRole("status")).toHaveTextContent("= 1.000");
  });

  it("Word order: a shuffled sentence scores 1 against the original", async () => {
    render(<WordOrderLab rand={() => 0} />);
    await userEvent.click(screen.getByRole("button", { name: /Shuffle the words/ }));
    expect(screen.getByRole("status")).toHaveTextContent("1.000");
  });

  it("TF-IDF: 'the' weighs less than 'film' in the first sentence", () => {
    render(<TfIdfLab />);
    const bars = screen.getByRole("list", { name: "TF-IDF weight of each word" });
    expect(within(bars).getAllByText("0.693")).toHaveLength(2); // the, was: in 2 of 4 documents
    expect(within(bars).getAllByText("1.386").length).toBeGreaterThan(0);
  });

  it("Exact terms: the error code finds its one article", () => {
    render(<KeywordWinsLab />);
    const first = within(screen.getByRole("list", { name: "Results" })).getAllByRole("listitem")[0]!;
    expect(first).toHaveTextContent("ERR-4021 means the payment card has expired");
  });

  it("Bridge: MiniLM rates film/movie far higher than word counts do", () => {
    render(<BridgeLab />);
    expect(screen.getByText("0.891")).toBeInTheDocument();
    expect(screen.getByText("0.906")).toBeInTheDocument();
  });
});
