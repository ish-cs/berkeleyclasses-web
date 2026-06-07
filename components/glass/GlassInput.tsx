"use client";

import { forwardRef, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode;
  inputStyle?: CSSProperties;
};

const GlassInput = forwardRef<HTMLInputElement, Props>(function GlassInput(
  { icon, inputStyle, style, ...rest },
  ref,
) {
  const [f, setF] = useState(false);
  return (
    <div style={{ position: "relative", width: "100%", ...style }}>
      {icon && (
        <span
          style={{
            position: "absolute",
            left: "0.85rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--glass-text-faint)",
            pointerEvents: "none",
            fontSize: "0.95rem",
          }}
        >
          {icon}
        </span>
      )}
      <input
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
          padding: icon ? "0.6rem 1rem 0.6rem 2.3rem" : "0.6rem 1rem",
          fontSize: "0.9375rem",
          fontFamily: "var(--font-text)",
          color: "var(--glass-text)",
          outline: "none",
          boxShadow: f
            ? "inset 0 1px 3px rgba(0,0,0,0.4), 0 0 0 3px rgba(74,144,217,0.22)"
            : "inset 0 1px 3px rgba(0,0,0,0.35)",
          transition: "all var(--dur) var(--spring-soft)",
          ...inputStyle,
        }}
      />
    </div>
  );
});

export default GlassInput;
