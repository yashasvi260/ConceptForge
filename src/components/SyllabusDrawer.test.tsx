import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SUBJECTS } from "../core/registry";
import { emptyProgress } from "../core/storage";
import { SyllabusDrawer } from "./SyllabusDrawer";

const [m1, m2] = SUBJECTS;
const props = { open: true, subjects: SUBJECTS, progress: {}, activeId: m1!.id, onClose: vi.fn(), onOpenModule: vi.fn(), onHome: vi.fn() };

describe("SyllabusDrawer", () => {
  it("renders nothing when closed", () => {
    render(<SyllabusDrawer {...props} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lists 4 parts and 14 modules", () => {
    render(<SyllabusDrawer {...props} />);
    const dialog = screen.getByRole("dialog", { name: "Course syllabus" });
    expect(within(dialog).getAllByRole("group")).toHaveLength(4);
    expect(within(dialog).getAllByRole("button", { name: /^\d\d\./ })).toHaveLength(14);
  });

  it("highlights the active module and marks completed ones", () => {
    const progress = { [m1!.id]: { ...emptyProgress(), visitedSteps: m1!.steps.map((s) => s.id), attempts: 1 } };
    render(<SyllabusDrawer {...props} progress={progress} />);
    const active = screen.getByRole("button", { name: new RegExp(`^01\\. ${m1!.title}`) });
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active).toHaveTextContent("✓");
    expect(screen.getByRole("button", { name: new RegExp(`^02\\. ${m2!.title}`) })).toHaveTextContent("○");
  });

  it("Escape closes", async () => {
    const onClose = vi.fn();
    render(<SyllabusDrawer {...props} onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("clicking a built module opens it", async () => {
    const onOpenModule = vi.fn();
    render(<SyllabusDrawer {...props} onOpenModule={onOpenModule} />);
    await userEvent.click(screen.getByRole("button", { name: new RegExp(`^02\\. ${m2!.title}`) }));
    expect(onOpenModule).toHaveBeenCalledWith(m2!.id);
  });

  it("unbuilt modules are disabled", () => {
    render(<SyllabusDrawer {...props} />);
    expect(screen.getByRole("button", { name: /^14\. Evals, Guardrails/ })).toBeDisabled();
  });

  it("Tab and Shift+Tab stay inside the dialog", async () => {
    render(
      <>
        <button type="button">outside</button>
        <SyllabusDrawer {...props} />
      </>,
    );
    const dialog = screen.getByRole("dialog");
    const last = screen.getByRole("button", { name: "← Course overview" });
    last.focus();
    await userEvent.tab();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(screen.getByRole("button", { name: "Close syllabus" })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  it("has a way back to the course overview", async () => {
    const onHome = vi.fn();
    render(<SyllabusDrawer {...props} onHome={onHome} />);
    await userEvent.click(screen.getByRole("button", { name: "← Course overview" }));
    expect(onHome).toHaveBeenCalled();
  });
});
