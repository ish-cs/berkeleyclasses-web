"use client";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { Button } from "./Button";

// Legacy variants — "glass" maps to "default", "ghost" maps to "default" with ghost class
type LegacyVariant = "glass" | "primary" | "gold" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: LegacyVariant;
  size?: Size;
  style?: CSSProperties;
};

export const GlassButton = forwardRef<HTMLButtonElement, Props>(function GlassButton(
  { variant = "glass", size = "md", className, ...rest },
  ref,
) {
  const mapped = variant === "glass" || variant === "ghost" ? "default" : variant;
  const ghostClass = variant === "ghost" ? "bc-btn--ghost" : null;
  return (
    <Button
      ref={ref}
      variant={mapped}
      size={size}
      className={[ghostClass, className].filter(Boolean).join(" ") || undefined}
      {...rest}
    />
  );
});

export default GlassButton;
