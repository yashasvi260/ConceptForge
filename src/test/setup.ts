import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// findBy*/waitFor default to 1 s; real tokenizers can take longer to load on slow CI runners.
configure({ asyncUtilTimeout: 20_000 });

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.location.hash = "";
});
