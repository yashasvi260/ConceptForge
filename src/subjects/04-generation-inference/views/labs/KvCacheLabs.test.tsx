import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { KvEqualLab, KvMemoryLab, KvShapesLab } from "./KvCacheLabs";

describe("Module 04 KV-cache labs", () => {
  it("Inside the cache: GPT-2's real 24-token cache holds 442,368 numbers; each token adds 73,728 bytes", () => {
    render(<KvShapesLab />);
    expect(screen.getByRole("status")).toHaveTextContent("24 tokens: 12 layers × keys and values of shape (1, 12, 24, 64) = 442,368 numbers; each token adds 73,728 bytes.");
    fireEvent.change(screen.getByRole("slider", { name: "Tokens in the cache" }), { target: { value: "1024" } });
    expect(screen.getByRole("status")).toHaveTextContent("= 18,874,368 numbers");
  });

  it("Same answer: both real loops chose the same 20 tokens; 24 vs 290 tokens fed", () => {
    render(<KvEqualLab />);
    expect(screen.getByRole("status")).toHaveTextContent('Step 20: both loops chose " contact"; fed 24 vs 290 tokens so far. All 20 tokens identical: yes; largest logit difference 0.000671.');
    fireEvent.change(screen.getByRole("slider", { name: "Step" }), { target: { value: "1" } });
    expect(screen.getByRole("status")).toHaveTextContent('Step 1: both loops chose " approved"; fed 5 vs 5 tokens so far.');
  });

  it("Memory bill: Llama 3 8B holds 1.07 GB at 8,192 tokens and passes 4 GB at 30,518", async () => {
    render(<KvMemoryLab />);
    expect(screen.getByRole("status")).toHaveTextContent("Llama 3 8B at 8,192 tokens: 1.07 GB of cache next to 16.06 GB of weights (131,072 bytes per token); one conversation passes 4 GB at 30,518 tokens.");
    await userEvent.click(screen.getByRole("radio", { name: "GPT-3 175B" }));
    fireEvent.change(screen.getByRole("slider", { name: "Context length" }), { target: { value: "11" } });
    expect(screen.getByRole("status")).toHaveTextContent("GPT-3 175B at 2,048 tokens: 9.66 GB of cache");
  });
});
