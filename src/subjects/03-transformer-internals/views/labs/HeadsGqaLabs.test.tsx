import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HeadAblationLab, HeadGridLab, HeadSplitLab, KvBudgetLab, KvRepeatLab, KvSharingLab, llamaKvPerToken } from "./HeadsGqaLabs";

describe("Module 03 multi-head and GQA labs", () => {
  it("Head split: parameters stay 2,362,368 for any number of heads", async () => {
    render(<HeadSplitLab />);
    expect(screen.getByRole("status")).toHaveTextContent("12 heads × 64 numbers each; attention parameters stay 2,362,368; 1,728 attention weights");
    await userEvent.click(screen.getByRole("radio", { name: "48" }));
    expect(screen.getByRole("status")).toHaveTextContent("48 heads × 16 numbers each; attention parameters stay 2,362,368");
  });

  it("Head grid: layer 2 gives ' loan' several favourite keys; layer 6 only the first token", () => {
    render(<HeadGridLab />);
    expect(screen.getByRole("status")).toHaveTextContent('Layer 2: " loan"\'s 12 heads have 4 different favourite keys.');
    fireEvent.change(screen.getByRole("slider", { name: "Layer" }), { target: { value: "6" } });
    expect(screen.getByRole("status")).toHaveTextContent("have 1 different favourite key.");
  });

  it("Head ablation: the previous-token head costs +0.0053; 78 heads add less than 0.01", async () => {
    render(<HeadAblationLab />);
    expect(screen.getByRole("status")).toHaveTextContent("Layer 4, head 11: loss 4.047 → 4.052 (+0.0053). 78 of 144 heads add less than 0.01.");
    await userEvent.click(screen.getByRole("button", { name: /^Layer 0, head 10:/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Layer 0, head 10: loss 4.047 → 4.533 (+0.4859)");
  });

  it("KV sharing: 8 KV heads is grouped-query with groups of 4; 1 is multi-query", async () => {
    render(<KvSharingLab />);
    expect(screen.getByRole("status")).toHaveTextContent("8 key-value heads (grouped-query attention): 4 query heads per key-value head; the cache is 4× smaller");
    await userEvent.click(screen.getByRole("radio", { name: "1" }));
    expect(screen.getByRole("status")).toHaveTextContent("1 key-value head (multi-query attention): 32 query heads per key-value head");
  });

  it("KV budget: a 24 GB GPU holds 15,143 tokens with MHA and 60,573 with GQA", () => {
    expect(llamaKvPerToken(8)).toBe(131072);
    render(<KvBudgetLab />);
    expect(screen.getByRole("status")).toHaveTextContent("leaves room for 15,143 tokens of cache with multi-head attention, 60,573 with GQA: 7 conversations of 8,192 tokens.");
  });

  it("repeat_kv: the cache stores 8 heads; each is repeated 4× at attention time", () => {
    render(<KvRepeatLab />);
    expect(screen.getByRole("status")).toHaveTextContent("8 KV heads: the cache holds 2,048,000 numbers per layer for 1,000 tokens; each is repeated 4× only at attention time.");
  });
});
