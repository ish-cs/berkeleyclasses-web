"use client";

import { useState, type CSSProperties, type ReactNode, type MouseEvent } from "react";

export default function GlassPill({
  active,
  children,
  onClick,
  style,
  title,
}: {
  active?: boolean;
  children?: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
  title?: string;
}) {
  const [h, setH] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      title={title}
      style={{
        borderRadius: "var(--r-pill)",
        padding: "0.35rem 0.8rem",
        fontSize: "0.8125rem",
        fontWeight: 600,
        fontFamily: "var(--font-text)",
        letterSpacing: "var(--tracking-text)",
        cursor: "pointer",
        border: "1px solid",
        whiteSpace: "nowrap",
        backdropFilter: "blur(var(--glass-blur))",
        WebkitBackdropFilter: "blur(var(--glass-blur))",
        background: active
          ? "linear-gradient(180deg, rgba(74,144,217,0.5), rgba(0,50,98,0.6))"
          : h
            ? "var(--glass-hover)"
            : "var(--glass-1)",
        color: active ? "#fff" : "var(--glass-text-muted)",
        borderColor: active ? "rgba(120,180,240,0.55)" : "var(--glass-border)",
        boxShadow: active
          ? "inset 0 1px 0 rgba(255,255,255,0.35), 0 0 16px -4px rgba(74,144,217,0.6)"
          : "inset 0 1px 0 rgba(255,255,255,0.15)",
        transition: "all var(--dur) var(--spring-soft)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
