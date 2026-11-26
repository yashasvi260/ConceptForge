import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SUBJECTS } from "../../core/registry";
import type { DeepLesson, LessonStep } from "../../core/types";
import { PyRunnerProvider } from "../../py/PyRunnerContext";
import { DeepLessonPage } from "./DeepLessonPage";

const DEEP: DeepLesson = {
  why: ["Computers only do arithmetic."],
  worked: [
    { kind: "text", text: "Start with three words." },
    { kind: "math", text: "3 × 4" },
    { kind: "table", caption: "Token IDs", columns: ["token", "id"], rows: [["The", 464]], source: "worked/x.py" },
  ],
  concept: [
    {
      heading: "Embedding table",
      paragraphs: ["A table of vectors."],
      formula: { expr: "E[id]", symbols: [{ sym: "E", meaning: "the embedding table" }], example: "E[464] is row 464." },
      mistake: "It is not a dictionary of meanings.",
    },
    { heading: "Positions", paragraphs: ["Order matters."] },
  ],
  guided: "Predict which part grows, then click it.",
  build: { id: "ex", title: "Look it up", packages: [], parts: [{ id: "p1", prompt: "Do it.", starter: "x = 1", solution: "x = 2", checks: "def check_x(ns): pass", hints: [] }] },
  local: [{ id: "l1", title: "With transformers", install: "pip install transformers==4.0.0", code: "print('hi')", output: "hi" }],
  checks: [
    { id: "c1", prompt: "Which is a lookup?", options: ["The embedding table", "Attention"], correctIndex: 0, explanation: "IDs index rows." },
    { id: "c2", prompt: "Second?", options: ["a", "b"], correctIndex: 1, explanation: "Because b." },
  ],
  oneSentence: "An ID picks a row.",
  deeper: [{ label: "GPT-2 paper", url: "https://example.org/gpt2", adds: "The original model." }],
};

const subject = SUBJECTS[0]!;
const step: LessonStep = { id: "s", title: "Anatomy of an LLM", summary: "The short version.", body: [], view: "x", deep: DEEP };

function renderPage() {
  return render(
    <PyRunnerProvider run={vi.fn()}>
      <DeepLessonPage
        subject={subject}
        step={step}
        stepIndex={1}
        total={12}
        isBuilt={() => true}
        onOpenModule={() => {}}
        data={undefined}
        passedParts={[]}
        onPartPassed={() => {}}
        footer={<p>footer here</p>}
      >
        <p>the stage</p>
      </DeepLessonPage>
    </PyRunnerProvider>,
  );
}

describe("DeepLessonPage", () => {
  it("shows the title, summary and the six sections in order", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 2, name: "Anatomy of an LLM" })).toBeInTheDocument();
    expect(screen.getByText("The short version.")).toBeInTheDocument();
    const names = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(names).toEqual(["1 · Why it exists", "2 · Worked example", "3 · The concept", "4 · Build it", "5 · Check", "6 · In one sentence"]);
  });

  it("renders worked tables, formulas with their symbols, and common mistakes", () => {
    renderPage();
    const table = screen.getByRole("table", { name: "Token IDs" });
    expect(within(table).getByRole("cell", { name: "464" })).toBeInTheDocument();
    expect(screen.getByText("E[id]")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "the embedding table" })).toBeInTheDocument();
    expect(screen.getByText("E[464] is row 464.")).toBeInTheDocument();
    expect(screen.getByRole("note", { name: "Common mistake" })).toHaveTextContent("It is not a dictionary of meanings.");
  });

  it("puts the stage inside the concept, after the first part, with the guided task", () => {
    renderPage();
    const region = screen.getByRole("region", { name: "Interactive stage" });
    expect(region).toHaveTextContent("the stage");
    expect(screen.getByText("Predict which part grows, then click it.")).toBeInTheDocument();
    const order = [screen.getByText("A table of vectors."), region, screen.getByText("Order matters.")];
    expect(order[0]!.compareDocumentPosition(order[1]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(order[1]!.compareDocumentPosition(order[2]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows the exercise, the local listing with captured output, and copies its code", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderPage();
    expect(screen.getByRole("heading", { name: "Look it up" })).toBeInTheDocument();
    expect(screen.getByText("pip install transformers==4.0.0")).toBeInTheDocument();
    expect(screen.getByText("Output (captured from a real run)")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Copy code: With transformers" }));
    expect(writeText).toHaveBeenCalledWith("print('hi')");
  });

  it("checks an inline question and explains the answer", async () => {
    renderPage();
    const q = screen.getByRole("group", { name: "Which is a lookup?" });
    await userEvent.click(within(q).getByRole("radio", { name: "Attention" }));
    await userEvent.click(within(q).getByRole("button", { name: "Check" }));
    expect(within(q).getByRole("status")).toHaveTextContent("Not quite");
    await userEvent.click(within(q).getByRole("radio", { name: "The embedding table" }));
    await userEvent.click(within(q).getByRole("button", { name: "Check" }));
    expect(within(q).getByRole("status")).toHaveTextContent("Correct");
    expect(within(q).getByText("IDs index rows.")).toBeInTheDocument();
  });

  it("ends with the one-sentence summary, sources and the footer", () => {
    renderPage();
    expect(screen.getByText("An ID picks a row.")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "GPT-2 paper" });
    expect(link).toHaveAttribute("href", "https://example.org/gpt2");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByText("footer here")).toBeInTheDocument();
  });
});
