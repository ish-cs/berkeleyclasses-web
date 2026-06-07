"use client";

import { forwardRef, useState, type SelectHTMLAttributes, type CSSProperties } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & { style?: CSSProperties };

const GlassSelect = forwardRef<HTMLSelectElement, Props>(function GlassSelect(
  { style, children, ...rest },
  ref,
) {
  const [f, setF] = useState(false);
  return (
    <select
      ref={ref}
      onFocus={(e) => {
        setF(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setF(false);
        rest.onBlur?.(e);
      }}
      {...rest}
      style={{
        width: "100%",
        borderRadius: "var(--r-pill)",
        background: "rgba(0,0,0,0.22)",
        border: "1px solid",
        borderColor: f ? "rgba(120,180,240,0.6)" : "var(--glass-border)",
        padding: "0.6rem 1rem",
        fontSize: "0.9375rem",
        fontFamily: "var(--font-text)",
        color: "var(--glass-text)",
        outline: "none",
        appearance: "none",
        cursor: "pointer",
        boxShadow: f
          ? "inset 0 1px 3px rgba(0,0,0,0.4), 0 0 0 3px rgba(74,144,217,0.22)"
          : "inset 0 1px 3px rgba(0,0,0,0.35)",
        transition: "all var(--dur) var(--spring-soft)",
        ...style,
      }}
    >
      {children}
    </select>
  );
});

export default GlassSelect;
