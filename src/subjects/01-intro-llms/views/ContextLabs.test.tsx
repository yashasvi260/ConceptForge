import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BankMatrixLab, ContextMixLab, ContextReachLab, SenseByExampleLab, TokenSentenceLab } from "./ContextLabs";

const setSlider = (name: string | RegExp, value: string) => {
  const s = screen.getByRole("slider", { name });
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(s, value);
    s.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

describe("context labs", () => {
  it("Four banks: real scores, and a static table gives 1 everywhere", async () => {
    render(<BankMatrixLab />);
    expect(screen.getAllByText("0.902")).toHaveLength(2);
    await userEvent.click(screen.getByRole("switch"));
    expect(screen.getAllByText("1.000")).toHaveLength(16);
  });

  it("Mixing: cash + loan pulls bank to the money sense, as in the worked example", () => {
    render(<ContextMixLab />);
    expect(screen.getByRole("status")).toHaveTextContent("(0.80 money, 0.20 water)");
  });

  it("Reach: a 3,000-token document fits Llama 3 8B but not GPT-2; a decoder's bank can't see river", async () => {
    render(<ContextReachLab />);
    expect(screen.getByText(/Llama 3 8B \(window 8,192\): fits/)).toBeInTheDocument();
    expect(screen.getByText(/GPT-2 small \(window 1,024\): only the last/)).toBeInTheDocument();
    expect(screen.getByText(/can't see river yet/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("switch"));
    expect(screen.getByText(/sees river/)).toBeInTheDocument();
    setSlider("Document length (tokens)", "500");
    expect(screen.getByText(/GPT-2 small \(window 1,024\): fits/)).toBeInTheDocument();
  });

  it("Tokens → sentence: the average equals MiniLM's sentence vector", () => {
    render(<TokenSentenceLab />);
    expect(screen.getByRole("status")).toHaveTextContent("1.0000");
  });

  it("Sense by example: 3 of 4 right, honestly", () => {
    render(<SenseByExampleLab />);
    expect(screen.getByRole("status")).toHaveTextContent("3 of 4 right");
  });
});
