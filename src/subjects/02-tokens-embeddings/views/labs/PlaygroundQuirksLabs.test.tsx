import { render, screen } from "@testing-library/react";
import { Tiktoken } from "js-tiktoken/lite";
import gpt2Ranks from "js-tiktoken/ranks/gpt2";
import { describe, expect, it } from "vitest";
import { ChunkerLab, GlitchLab, NumberChunksLab } from "./PlaygroundQuirksLabs";

describe("Module 02 playground and quirks labs", () => {
  it("Numbers: GPT-4o's real pieces for 1000 and 10000", async () => {
    render(<NumberChunksLab />);
    expect(await screen.findByText("100 | 0", {}, { timeout: 20000 })).toBeInTheDocument();
    expect(screen.getByText("100 | 00")).toBeInTheDocument();
  }, 30000);

  it("Glitch: SolidGoldMagikarp is a single GPT-2 token (43453)", async () => {
    render(<GlitchLab load={() => Promise.resolve(new Tiktoken(gpt2Ranks))} />);
    const s = await screen.findByRole("status", {}, { timeout: 20000 });
    expect(s).toHaveTextContent("1 token");
    expect(screen.getByText("43453")).toBeInTheDocument();
  }, 30000);

  it("Chunker: overlap makes more chunks than the document has room for without it", async () => {
    render(<ChunkerLab />);
    const s = await screen.findByText(/tokens → \d+ chunks/, {}, { timeout: 20000 });
    const m = s.textContent!.match(/(\d+) tokens → (\d+) chunks, (\d+) tokens stored/)!;
    expect(Number(m[3])).toBeGreaterThan(Number(m[1]));
  }, 30000);
});
