import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BeamLab, GreedyLoopLab, TempSamplesLab, TemperatureLab, repeatedTokens, toyBeam } from "./DecodingLabs";

describe("Module 04 decoding labs", () => {
  it("repeatedTokens marks only runs that appeared earlier", () => {
    expect([...repeatedTokens(["a", "b", "c", "d", "a", "b", "c", "d"])]).toEqual([4, 5, 6, 7]);
    expect(repeatedTokens(["a", "b", "c", "d", "e"]).size).toBe(0);
  });

  it("Greedy loops: the cat continuation repeats itself; the loan one far less", async () => {
    render(<GreedyLoopLab />);
    const n = () => Number(/^(\d+) of 40/.exec(screen.getByRole("status").textContent ?? "")![1]);
    const cat = n();
    expect(cat).toBe(11);
    await userEvent.click(screen.getByRole("radio", { name: "Your loan application has been" }));
    expect(n()).toBeLessThan(cat);
  });

  it("Temperature: ' floor' has 7.6% at T = 1 and 78.6% at T = 0.1", () => {
    render(<TemperatureLab />);
    expect(screen.getByRole("status")).toHaveTextContent('T = 1.0: " floor" has 7.6%; entropy 7.813 bits; 728 tokens cover 90%.');
    fireEvent.change(screen.getByRole("slider", { name: "Temperature" }), { target: { value: "0.1" } });
    expect(screen.getByRole("status")).toHaveTextContent('T = 0.1: " floor" has 78.6%; entropy 0.99 bits; 2 tokens cover 90%.');
  });

  it("Seeded samples: at T = 1 seed 0 picks a token ranked 10,730th", async () => {
    render(<TempSamplesLab />);
    expect(screen.getByRole("status")).toHaveTextContent("T=1.0, seed 0: 4 of 30 tokens ranked outside the top 100 (worst 10,730); log-probability -132.711.");
    await userEvent.click(screen.getByRole("radio", { name: "0.3" }));
    expect(screen.getByRole("status")).toHaveTextContent("T=0.3, seed 0: 0 of 30 tokens ranked outside the top 100 (worst 11)");
  });

  it("Beam: 1 beam is greedy (A B z, 0.20); 2 beams find A C x (0.36)", async () => {
    expect(toyBeam(1).at(-1)![0]!.seq).toEqual(["A", "B", "z"]);
    render(<BeamLab />);
    expect(screen.getByRole("status")).toHaveTextContent("1 beam: best sequence A B z with probability 0.20.");
    await userEvent.click(screen.getByRole("radio", { name: "2" }));
    expect(screen.getByRole("status")).toHaveTextContent("2 beams: best sequence A C x with probability 0.36.");
    expect(screen.getByText(/about 990× more likely than greedy's/)).toBeInTheDocument();
  });
});
