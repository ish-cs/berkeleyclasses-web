"use client";
import { useTheme } from "./use-theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="theme-toggle"
      data-theme-state={theme}
    >
      <span className="theme-toggle-knob" />
    </button>
  );
}
