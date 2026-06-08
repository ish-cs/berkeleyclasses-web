"use client";
import { forwardRef } from "react";
import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode;
  inputStyle?: CSSProperties;
};

export const GlassInput = forwardRef<HTMLInputElement, Props>(
  function GlassInput({ className, icon, inputStyle, style, ...rest }, ref) {
    return (
      <div style={{ position: "relative", width: "100%", ...style }}>
        {icon && (
          <span
            style={{
              position: "absolute",
              left: "0.85rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
              pointerEvents: "none",
              fontSize: "0.95rem",
            }}
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={["bc-input", icon ? "bc-input--icon" : null, className].filter(Boolean).join(" ")}
          style={inputStyle}
          {...rest}
        />
      </div>
    );
  }
);

export default GlassInput;
