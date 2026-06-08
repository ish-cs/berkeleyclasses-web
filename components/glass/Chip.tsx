"use client";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  tone?: "default" | "gold";
};

export const Chip = forwardRef<HTMLButtonElement, Props>(function Chip(
  { selected, tone = "default", className, children, ...rest }, ref
) {
  return (
    <button
      ref={ref}
      aria-pressed={selected}
      className={["bc-chip", selected ? "bc-chip--on" : null, tone === "gold" ? "bc-chip--gold" : null, className].filter(Boolean).join(" ")}
      {...rest}
    >
      <span className="bc-btn-spec" aria-hidden />
      <span className="bc-btn-label">{children}</span>
    </button>
  );
});
