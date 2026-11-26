import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RichText } from "./ui";

describe("RichText", () => {
  it("renders `code` and **bold** spans", () => {
    const { container } = render(<RichText text="a `x` and **big** word" />);
    expect(container.querySelector("code")?.textContent).toBe("x");
    expect(container.querySelector("strong")?.textContent).toBe("big");
    expect(container.textContent).toBe("a x and big word");
  });

  it("renders *italic* spans, without touching bold, code or a spaced-out multiplication", () => {
    const { container } = render(<RichText text="the suffix *-est* and **bold** and `2 * n * t` and a * b * c" />);
    expect([...container.querySelectorAll("em")].map((e) => e.textContent)).toEqual(["-est"]);
    expect(container.querySelector("strong")?.textContent).toBe("bold");
    expect(container.querySelector("code")?.textContent).toBe("2 * n * t");
    expect(container.textContent).toBe("the suffix -est and bold and 2 * n * t and a * b * c");
  });
});
