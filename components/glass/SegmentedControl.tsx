"use client";

import type { CSSProperties } from "react";

type Option = string | { value: string; label: string };

function optVal(o: Option) {
  return typeof o === "string" ? o : o.value;
}
function optLabel(o: Option) {
  return typeof o === "string" ? o : o.label;
}

export default function SegmentedControl({
  options = [],
  value,
  onChange,
  style,
}: {
  options: Option[];
  value: string;
  onChange?: (v: string) => void;
  style?: CSSProperties;
}) {
  const n = Math.max(1, options.length);
  const idx = Math.max(0, options.findIndex((o) => optVal(o) === value));
  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(${n}, 1fr)`,
        padding: "3px",
        borderRadius: "var(--r-pill)",
        background: "var(--glass-1)",
        border: "1px solid var(--glass-border)",
        backdropFilter: "blur(var(--glass-blur))",
        WebkitBackdropFilter: "blur(var(--glass-blur))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
        ...style,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "3px",
          bottom: "3px",
          left: `calc(3px + ${idx} * ((100% - 6px) / ${n}))`,
          width: `calc((100% - 6px) / ${n})`,
          borderRadius: "var(--r-pill)",
          background: "var(--glass-3)",
          border: "1px solid var(--glass-border-strong)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 8px rgba(0,0,0,0.35)",
          transition: "left var(--dur) var(--spring)",
        }}
      />
      {options.map((o) => {
        const v = optVal(o);
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange?.(v)}
            style={{
              position: "relative",
              zIndex: 1,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "0.4rem 0.7rem",
              fontFamily: "var(--font-text)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: active ? "var(--glass-text)" : "var(--glass-text-muted)",
              transition: "color var(--dur) var(--spring-soft)",
              whiteSpace: "nowrap",
            }}
          >
            {optLabel(o)}
          </button>
        );
      })}
    </div>
  );
}
