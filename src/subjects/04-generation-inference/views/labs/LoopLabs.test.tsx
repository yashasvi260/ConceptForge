import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LoopStepsLab, PrefillDecodeLab, RepetitionLab, StopRulesLab, runStops } from "./LoopLabs";

describe("Module 04 generation-loop labs (real GPT-2 small)", () => {
  it("Loop: step 1 reads the 5-token prompt; step 4's newline is nearly forced", async () => {
    render(<LoopStepsLab />);
    expect(screen.getByRole("status")).toHaveTextContent('Step 1: fed 5 tokens, attended to 5, chose " approved" at 24.3%.');
    for (let i = 0; i < 3; i++) await userEvent.click(screen.getByRole("button", { name: "Next step" }));
    expect(screen.getByRole("status")).toHaveTextContent('Step 4: fed 1 token, attended to 8, chose "\\n" at 100.0%.');
  });

  it("runStops cuts before the stop sequence and reports why", () => {
    expect(runStops([" a", ".", " b"], 10, ".")).toEqual({ text: " a", reason: "stop", used: 2 });
    expect(runStops([" a", ".", " b"], 2, "")).toEqual({ text: " a.", reason: "length", used: 2 });
    expect(runStops(["1", "-", "800"], 10, "1-800").text).toBe("");
  });

  it("Stopping rules: a blank line ends the real reply after ' approved.'", () => {
    render(<StopRulesLab />);
    expect(screen.getByRole("status")).toHaveTextContent('finish_reason "stop" after 4 tokens; the caller receives 10 characters.');
    fireEvent.click(screen.getByRole("radio", { name: "none" }));
    fireEvent.change(screen.getByRole("slider", { name: "max_new_tokens" }), { target: { value: "12" } });
    expect(screen.getByRole("status")).toHaveTextContent('finish_reason "length" after 12 tokens');
  });

  it("Prefill vs decode: 512 prompt tokens + 100 answer tokens ≈ 0.44 s to first token, 3.01 s in all", () => {
    render(<PrefillDecodeLab />);
    expect(screen.getByRole("status")).toHaveTextContent("First token after about 0.44 s; done after about 3.01 s. The answer is 16% of the tokens and 85% of the time.");
  });

  it("Repetition: no penalty repeats 11 tokens; both penalties break the loop", async () => {
    render(<RepetitionLab />);
    expect(screen.getByRole("status")).toHaveTextContent("none: 11 of 40 tokens inside a repeated 4-token phrase; log-probability -49.546.");
    await userEvent.click(screen.getByRole("radio", { name: "repetition_penalty 1.2" }));
    expect(screen.getByRole("status")).toHaveTextContent("repetition_penalty 1.2: 0 of 40 tokens inside a repeated 4-token phrase; log-probability -93.693.");
    await userEvent.click(screen.getByRole("radio", { name: "no_repeat_ngram_size 3" }));
    expect(screen.getByRole("status")).toHaveTextContent("log-probability -60.387.");
  });
});
