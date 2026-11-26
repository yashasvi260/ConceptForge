import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App, { AUTOPLAY_MS } from "./App";
import { SUBJECTS } from "./core/registry";
import { LAST_SUBJECT_KEY, PROGRESS_KEY } from "./core/storage";
import type { DeepLesson, SubjectModule } from "./core/types";
import { resetDeepCache } from "./core/useDeepContent";

const first = SUBJECTS[0]!;
const second = SUBJECTS[1]!;
const total = first.steps.length;
const counter = (i: number) => new RegExp(`Step ${i} / ${total}`);
const stepTitle = () => screen.getByRole("heading", { level: 2 }).textContent;
const onCourse = () => screen.queryByRole("heading", { level: 1, name: "LLM Mastery" });
const openFirst = () => {
  window.location.hash = `#/${first.id}/1`;
};
/** A module that still uses the split layout (Auto-Play and key takeaway live there). */
const plain = SUBJECTS.find((s) => s.steps.every((st) => !st.deep))!;
const plainCounter = (i: number) => new RegExp(`Step ${i} / ${plain.steps.length}`);
const openPlain = () => {
  window.location.hash = `#/${plain.id}/1`;
};

describe("App shell: course overview", () => {
  it("starts on the course overview", () => {
    render(<App />);
    expect(onCourse()).toBeInTheDocument();
    expect(screen.getByText("0 / 18 modules · 0%")).toBeInTheDocument();
    expect(screen.getByText("Mastered 0/18")).toBeInTheDocument();
  });

  it("Start Module 01 opens step 1 and writes the hash", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Start Module 01 →" }));
    expect(stepTitle()).toBe(first.steps[0]!.title);
    expect(window.location.hash).toBe(`#/${first.id}/1`);
  });

  it("breadcrumb LLM Mastery returns to the course overview", async () => {
    openFirst();
    render(<App />);
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(crumbs).toHaveTextContent(`01. ${first.title}`);
    await userEvent.click(within(crumbs).getByRole("button", { name: "LLM Mastery" }));
    expect(onCourse()).toBeInTheDocument();
    expect(window.location.hash).toBe("#/");
  });

  it("back to #/ shows the course overview", () => {
    openFirst();
    render(<App />);
    expect(onCourse()).not.toBeInTheDocument();
    act(() => {
      window.location.hash = "#/";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(onCourse()).toBeInTheDocument();
    act(() => {
      window.location.hash = `#/${first.id}/2`;
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(stepTitle()).toBe(first.steps[1]!.title);
  });

  it("shortcuts are off on the course page", () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: " ", code: "Space" });
    expect(onCourse()).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? "{}")[first.id]).toBeUndefined();
  });

  it("going home stops auto-play", () => {
    vi.useFakeTimers();
    try {
      openPlain();
      render(<App />);
      fireEvent.keyDown(window, { key: " ", code: "Space" });
      expect(screen.getByRole("button", { name: "Pause auto-play" })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "ConceptForge home" }));
      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_MS * 2 + 10);
      });
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`^Module ${String(plain.moduleNumber).padStart(2, "0")}.*${plain.title}`) }));
      expect(screen.getByText(plainCounter(1))).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Start auto-play" })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("opening a module adds one history entry; stepping inside it adds none", async () => {
    render(<App />);
    const before = window.history.length;
    await userEvent.click(screen.getByRole("button", { name: "Start Module 01 →" }));
    expect(window.history.length).toBe(before + 1);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(await screen.findByText(counter(3))).toBeInTheDocument();
    expect(window.history.length).toBe(before + 1);
  });

  it("closing the syllabus returns focus to the syllabus button", async () => {
    openFirst();
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Open syllabus" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open syllabus" })).toHaveFocus();
  });

  it("arrow keys still step after clicking a mode tab", async () => {
    openFirst();
    render(<App />);
    await userEvent.click(screen.getByRole("tab", { name: "Guided Steps" }));
    await userEvent.keyboard("{ArrowRight}");
    expect(await screen.findByText(counter(2))).toBeInTheDocument();
  });

  it("starts in the cream theme and the header switch toggles dark", async () => {
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe("cream");
    await userEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    await userEvent.click(screen.getByRole("button", { name: "Switch to cream theme" }));
    expect(document.documentElement.dataset.theme).toBe("cream");
  });

  it("a deleted subject in the hash shows the course overview", () => {
    window.location.hash = "#/transformers/3";
    window.localStorage.setItem(LAST_SUBJECT_KEY, "transformers");
    render(<App />);
    expect(onCourse()).toBeInTheDocument();
  });
});

describe("App shell: module player", () => {
  it("steps with the arrow keys and buttons, and mirrors the step in the URL", async () => {
    openFirst();
    render(<App />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(await screen.findByRole("heading", { level: 2, name: first.steps[1]!.title })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "ArrowLeft" }); // clamps at 0
    expect(await screen.findByRole("heading", { level: 2, name: first.steps[0]!.title })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next step" }));
    expect(screen.getByText(counter(2))).toBeInTheDocument();
    const last = first.steps[total - 1]!;
    await userEvent.click(screen.getByRole("button", { name: `Go to step ${total}: ${last.title}` }));
    expect(await screen.findByRole("heading", { level: 2, name: last.title })).toBeInTheDocument();
    expect(window.location.hash).toBe(`#/${first.id}/${total}`);
    expect(JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? "{}")[first.id].lastStep).toBe(total - 1);
  });

  it("ignores arrow keys typed into a text field", () => {
    openFirst();
    render(
      <>
        <App />
        <input aria-label="probe" />
      </>,
    );
    fireEvent.keyDown(screen.getByRole("textbox", { name: "probe" }), { key: "ArrowRight" });
    expect(screen.getByText(counter(1))).toBeInTheDocument();
  });

  it.skipIf(total < 3)("Space toggles auto-play, which advances on a timer", () => {
    vi.useFakeTimers();
    try {
      openPlain();
      render(<App />);
      fireEvent.keyDown(window, { key: " ", code: "Space" });
      expect(screen.getByRole("button", { name: "Pause auto-play" })).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_MS + 10);
      });
      expect(screen.getByText(plainCounter(2))).toBeInTheDocument();
      fireEvent.keyDown(window, { key: " ", code: "Space" });
      expect(screen.getByRole("button", { name: "Start auto-play" })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("opens a subject and step from the URL hash", () => {
    window.location.hash = `#/${first.id}/2`;
    render(<App />);
    expect(stepTitle()).toBe(first.steps[1]!.title);
  });

  it("last step offers the practice check", async () => {
    window.location.hash = `#/${first.id}/${total}`;
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Take Practice Check ✓" }));
    expect(screen.getByRole("tab", { name: /Practice Check/ })).toHaveAttribute("aria-selected", "true");
    expect(window.location.hash).toBe(`#/${first.id}/quiz`);
  });

  it("the practice check tab shows the quiz score badge", () => {
    window.location.hash = `#/${first.id}/quiz`;
    render(<App />);
    expect(screen.getByRole("tab", { name: `Practice Check 0/${first.challenges.length}` })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Guided Steps" })).toHaveAttribute("aria-selected", "false");
  });

  it("up next card opens the next built module at step 1", async () => {
    window.location.hash = `#/${first.id}/3`;
    render(<App />);
    const card = await screen.findByRole("region", { name: "Up next in syllabus" });
    expect(card).toHaveTextContent(`02. ${second.title}`);
    await userEvent.click(within(card).getByRole("button", { name: "Next module →" }));
    expect(await screen.findByRole("heading", { level: 2, name: second.steps[0]!.title })).toBeInTheDocument();
    expect(window.location.hash).toBe(`#/${second.id}/1`);
  });

  it("syllabus drawer opens and switches module", async () => {
    openFirst();
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Open syllabus" }));
    const dialog = screen.getByRole("dialog", { name: "Course syllabus" });
    await userEvent.click(within(dialog).getByRole("button", { name: new RegExp(`^02\\. ${second.title}`) }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 2, name: second.steps[0]!.title })).toBeInTheDocument();
  });

  it("opens old Tokenization links in Module 02 and keeps saved progress", () => {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify({ tokenization: { lastStep: 3, visitedSteps: ["why-numbers"], bestScore: null, lastScore: null, attempts: 0 } }));
    window.location.hash = "#/tokenization/7";
    render(<App />);
    const m2 = SUBJECTS.find((s) => s.id === "02-tokens-embeddings")!;
    expect(stepTitle()).toBe(m2.steps[6]!.title);
    const saved = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? "{}");
    expect(saved["02-tokens-embeddings"].visitedSteps).toContain("why-numbers");
    expect(saved.tokenization).toBeUndefined();
  });

  it("shows a coming-soon card for an unbuilt module link (old ids redirect), with a way back", async () => {
    window.location.hash = "#/07-agents-tools/1";
    render(<App />);
    expect(screen.getByRole("heading", { name: /Coming soon/ })).toBeInTheDocument();
    expect(screen.getByText(/Module 10: Agents and Tools/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Back to course overview" }));
    expect(onCourse()).toBeInTheDocument();
  });

  it("shows the step's key takeaway when it has one", () => {
    const withTakeaway = plain.steps.findIndex((s) => s.keyTakeaway);
    if (withTakeaway < 0) return;
    window.location.hash = `#/${plain.id}/${withTakeaway + 1}`;
    render(<App />);
    expect(screen.getByRole("note", { name: "Key takeaway" })).toHaveTextContent(plain.steps[withTakeaway]!.keyTakeaway!.replace(/`/g, ""));
  });
});

describe("App shell: deep lesson steps", () => {
  const deepStep = first.steps[0]!;
  const DEEP: DeepLesson = {
    why: ["w"],
    worked: [],
    concept: [{ heading: "H", paragraphs: ["p"] }],
    guided: "g",
    build: { id: "deep-test-ex", title: "Ex", packages: [], parts: [{ id: "p1", prompt: "x", starter: "", solution: "", checks: "", hints: [] }] },
    local: [],
    checks: [],
    oneSentence: "s",
    deeper: [],
  };
  let saved: Pick<SubjectModule, "loadDeep">;
  let savedFlag: boolean | undefined;
  let loads = 0;
  beforeEach(() => {
    saved = { loadDeep: first.loadDeep };
    savedFlag = deepStep.deep;
    loads = 0;
    deepStep.deep = true;
    first.loadDeep = async () => {
      loads++;
      return { lessons: { [deepStep.id]: DEEP }, data: {} };
    };
    resetDeepCache();
  });
  afterEach(() => {
    first.loadDeep = saved.loadDeep;
    deepStep.deep = savedFlag;
    resetDeepCache();
  });

  it("loads the lesson on demand, then renders the reading beside the practice panel, without Auto-Play", async () => {
    render(<App />);
    expect(loads).toBe(0); // nothing is fetched on the course page
    act(() => {
      window.location.hash = `#/${first.id}/1`;
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(screen.getByRole("status")).toHaveTextContent("Loading lesson…");
    expect(await screen.findByRole("heading", { level: 3, name: "1 · Why it exists" })).toBeInTheDocument();
    expect(loads).toBe(1);
    expect(screen.queryByRole("main", { name: "Interactive stage" })).toBeNull();
    expect(screen.getByRole("complementary", { name: "Practice" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Interactive stage" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start auto-play" })).toBeNull();
  });

  it("offers a retry when the lesson fails to load", async () => {
    let fail = true;
    first.loadDeep = async () => {
      if (fail) throw new Error("offline");
      return { lessons: { [deepStep.id]: DEEP }, data: {} };
    };
    openFirst();
    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load this lesson");
    fail = false;
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { level: 3, name: "1 · Why it exists" })).toBeInTheDocument();
  });

  it("leaves Space to the browser on a deep step, and arrows still step", async () => {
    openFirst();
    render(<App />);
    await screen.findByRole("heading", { level: 3, name: "1 · Why it exists" });
    const ev = new KeyboardEvent("keydown", { key: " ", code: "Space", cancelable: true });
    window.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText(counter(2))).toBeInTheDocument();
  });

  it("starts the next deep step at the top of its reading", async () => {
    openFirst();
    render(<App />);
    await screen.findByRole("heading", { level: 3, name: "1 · Why it exists" });
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText(counter(2))).toBeInTheDocument();
    expect(scroll).toHaveBeenCalledWith(0, 0);
    scroll.mockRestore();
  });

  it("marks the step on the step bar once its exercise is passed", async () => {
    window.localStorage.setItem("conceptforge:exercises:v1", JSON.stringify({ "deep-test-ex": ["p1"] }));
    openFirst();
    render(<App />);
    await screen.findByRole("heading", { level: 3, name: "1 · Why it exists" });
    expect(screen.getByRole("button", { name: `Go to step 1: ${deepStep.title}` })).toHaveAttribute("data-passed", "true");
  });
});
