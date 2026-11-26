import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import recorded from "../data/generation-tree.json";
import { BIGRAM_TEXT, BigramLab, GuessNextLab, NextTokenTasksLab, TemperatureLab, bigramCounts, greedyBigram, tokenize } from "./BigPictureLabs";
import type { GenRecording } from "./labkit";

const REC = recorded as unknown as GenRecording;
const load = () => Promise.resolve(REC);

describe("bigram helpers", () => {
  it("count pairs and get stuck greedily, as in the worked example", () => {
    const c = bigramCounts(tokenize(BIGRAM_TEXT));
    expect(Object.fromEntries(c.get("the")!)).toEqual({ cat: 2, mat: 1, fish: 1, dog: 1, rug: 1 });
    expect(greedyBigram(c, "the", 7).join(" ")).toBe("the cat sat on the cat sat on");
  });
});

describe("Module 01 step 1 labs", () => {
  it("Guess the next token: reveals gemma4's real probabilities and scores the guess", async () => {
    render(<GuessNextLab load={load} />);
    const group = await screen.findByRole("group", { name: "Your guess" });
    await userEvent.click(within(group).getByRole("button", { name: "small" }));
    expect(screen.getByRole("status")).toHaveTextContent("Spot on");
    expect(within(screen.getByRole("list", { name: "gemma4's real probabilities" })).getByText("93.9%")).toBeInTheDocument();
    expect(screen.getByText(/1 of 1 guesses/)).toBeInTheDocument();
  });

  it("Temperature: greedy at 0 puts everything on the top token, and sampling tallies 20 draws", async () => {
    render(<TemperatureLab load={load} rand={() => 0.99} />);
    const bars = await screen.findByRole("list", { name: "Probabilities after temperature" });
    expect(within(bars).getByText("␣village")).toBeInTheDocument();
    expect(within(bars).getByTitle("gemma4's raw probability: 72.5%")).toBeInTheDocument();
    const slider = screen.getByRole("slider", { name: "Temperature" });
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(slider, "0");
      slider.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(within(screen.getByRole("list", { name: "Probabilities after temperature" })).getByText("100.0%")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Sample 20 times/ }));
    const total = screen.getByRole("status").textContent!.match(/×(\d+)/g)!.reduce((s, m) => s + Number(m.slice(1)), 0);
    expect(total).toBe(20);
  });

  it("Bigram counter: shows counts, flags unseen pairs as impossible, and loops greedily", async () => {
    render(<BigramLab />);
    expect(within(screen.getByRole("list", { name: "What follows the" })).getByText("33.3%")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("16.7%");
    await userEvent.clear(screen.getByLabelText("Word to check"));
    await userEvent.type(screen.getByLabelText("Word to check"), "zebra");
    expect(screen.getByRole("status")).toHaveTextContent("never seen");
    expect(screen.getByText("the cat sat on the cat sat on the")).toBeInTheDocument();
  });

  it("What it takes to guess: reveals each prompt's real answer", async () => {
    render(<NextTokenTasksLab load={load} />);
    await userEvent.click(await screen.findByRole("button", { name: "Reveal gemma4's answer to The capital of France is" }));
    expect(within(screen.getByRole("list", { name: "gemma4's answer to The capital of France is" })).getByText("Paris")).toBeInTheDocument();
  });
});
