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
});
