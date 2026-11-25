import { describe, expect, it } from "vitest";
import { THEME_KEY, applyTheme, loadTheme } from "./theme";

describe("theme", () => {
  it("defaults to cream", () => {
    expect(loadTheme()).toBe("cream");
  });

  it("remembers dark and applies it to the page", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(THEME_KEY)).toBe("dark");
    expect(loadTheme()).toBe("dark");
  });

  it("treats unknown stored values as cream", () => {
    window.localStorage.setItem(THEME_KEY, "neon");
    expect(loadTheme()).toBe("cream");
  });
});
