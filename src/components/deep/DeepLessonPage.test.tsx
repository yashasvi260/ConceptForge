import { fireEvent, render, screen, within } from "@testing-library/react";
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
const step: LessonStep = { id: "s", title: "Anatomy of an LLM", summary: "The short version.", body: [], view: "x", deep: true };

function page(at: LessonStep = step, passedParts: string[] = []) {
  return (
    <PyRunnerProvider run={vi.fn()}>
      <DeepLessonPage
        subject={subject}
        step={at}
        lesson={DEEP}
        stepIndex={1}
        total={12}
        isBuilt={() => true}
        onOpenModule={() => {}}
        data={undefined}
        passedParts={passedParts}
        onPartPassed={() => {}}
        footer={<p>footer here</p>}
      >
        <p>the stage</p>
      </DeepLessonPage>
    </PyRunnerProvider>
  );
}

function renderPage(passedParts: string[] = []) {
  return render(page(step, passedParts));
}

const tab = (name: string) => screen.getByRole("tab", { name });
const openBuild = () => userEvent.click(tab("Build it · Python"));

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

  it("keeps the reading in its own column, beside a practice panel that opens on the interactive view", () => {
    renderPage();
    const reading = screen.getByRole("article", { name: "Lesson" });
    expect(within(reading).getByText("A table of vectors.")).toBeInTheDocument();
    expect(within(reading).getByText("Order matters.")).toBeInTheDocument();
    const panel = screen.getByRole("complementary", { name: "Practice" });
    expect(within(panel).getByRole("tablist")).toBeInTheDocument();
    expect(tab("Interactive")).toHaveAttribute("aria-selected", "true");
    expect(tab("Build it · Python")).toHaveAttribute("aria-selected", "false");
    expect(within(panel).getByRole("region", { name: "Interactive stage" })).toHaveTextContent("the stage");
    expect(within(reading).queryByText("the stage")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Look it up" })).toBeNull();
  });

  it("switches the panel to the Python exercise and back", async () => {
    renderPage();
    await openBuild();
    expect(tab("Build it · Python")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "Look it up" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Interactive stage" })).toBeNull();
    await userEvent.click(tab("Interactive"));
    expect(screen.getByRole("region", { name: "Interactive stage" })).toBeInTheDocument();
  });

  it("keeps the exercise mounted while the interactive view is shown, so code and results survive", async () => {
    renderPage();
    await openBuild();
    const box = screen.getByLabelText("Code for part 1");
    await userEvent.clear(box);
    await userEvent.type(box, "x = 5");
    await userEvent.click(tab("Interactive"));
    await openBuild();
    expect(screen.getByLabelText("Code for part 1")).toHaveValue("x = 5");
  });

  it("points from the reading to the panel: the guided task opens the interactive view, Build it opens the exercise", async () => {
    renderPage();
    const reading = screen.getByRole("article", { name: "Lesson" });
    expect(within(reading).getByText("Predict which part grows, then click it.")).toBeInTheDocument();
    await userEvent.click(within(reading).getByRole("button", { name: /Open the exercise/ }));
    expect(tab("Build it · Python")).toHaveAttribute("aria-selected", "true");
    await userEvent.click(within(reading).getByRole("button", { name: /Try it in the interactive view/ }));
    expect(tab("Interactive")).toHaveAttribute("aria-selected", "true");
  });

  it("says in the reading how many exercise parts are passed", () => {
    renderPage(["p1"]);
    const reading = screen.getByRole("article", { name: "Lesson" });
    expect(within(reading).getByText("Look it up")).toBeInTheDocument();
    expect(within(reading).getByText("1 of 1 parts passed")).toBeInTheDocument();
  });

  it("moves between the panel tabs with the arrow keys", () => {
    renderPage();
    tab("Interactive").focus();
    fireEvent.keyDown(tab("Interactive"), { key: "ArrowRight" });
    expect(tab("Build it · Python")).toHaveAttribute("aria-selected", "true");
    expect(tab("Build it · Python")).toHaveFocus();
    fireEvent.keyDown(tab("Build it · Python"), { key: "ArrowLeft" });
    expect(tab("Interactive")).toHaveAttribute("aria-selected", "true");
  });

  it("goes back to the interactive view on the next step", async () => {
    const { rerender } = renderPage();
    await openBuild();
    rerender(page({ ...step, id: "s2", title: "Next one" }));
    expect(tab("Interactive")).toHaveAttribute("aria-selected", "true");
  });

  it("shows the exercise, the local listing with captured output, and copies its code", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderPage();
    await openBuild();
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
