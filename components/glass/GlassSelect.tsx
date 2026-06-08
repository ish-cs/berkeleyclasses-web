"use client";
import { forwardRef } from "react";
import type { CSSProperties, SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & { style?: CSSProperties };

export const GlassSelect = forwardRef<HTMLSelectElement, Props>(
  function GlassSelect({ className, children, style, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={["bc-input", "bc-select", className].filter(Boolean).join(" ")}
        style={style}
        {...rest}
      >
        {children}
      </select>
    );
  }
);

export default GlassSelect;
