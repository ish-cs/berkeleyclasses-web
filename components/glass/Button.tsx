"use client";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "primary" | "gold";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "default", size = "md", className, children, ...rest }, ref
) {
  return (
    <button
      ref={ref}
      className={["bc-btn", `bc-btn--${variant}`, `bc-btn--${size}`, className].filter(Boolean).join(" ")}
      {...rest}
    >
      <span className="bc-btn-spec" aria-hidden />
      <span className="bc-btn-label">{children}</span>
    </button>
  );
});
