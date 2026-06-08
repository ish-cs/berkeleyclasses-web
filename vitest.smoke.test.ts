import { describe, expect, it } from "vitest";

describe("vitest smoke", () => {
  it("loads jest-dom matchers", () => {
    const el = document.createElement("button");
    el.setAttribute("aria-pressed", "true");
    expect(el).toHaveAttribute("aria-pressed", "true");
  });
});
