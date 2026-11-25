/** Colour theme: "cream" (light, warm paper) or "dark". Stored per browser; cream is the default. */
export type Theme = "cream" | "dark";

export const THEME_KEY = "conceptforge:theme:v1";

export function loadTheme(): Theme {
  try {
    return window.localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "cream";
  } catch {
    return "cream";
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked: the theme still applies for this visit.
  }
}
