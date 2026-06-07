"use client";

import { useState, type CSSProperties, type ReactNode, type MouseEvent } from "react";

type Elevation = 1 | 2 | 3;
type Radius = "sm" | "md" | "lg" | "xl";

const ELEV: Record<Elevation, { fill: string; shadow: string }> = {
  1: { fill: "var(--glass-1)", shadow: "var(--glass-shadow)" },
  2: { fill: "var(--glass-2)", shadow: "var(--glass-shadow)" },
  3: { fill: "var(--glass-3)", shadow: "var(--glass-shadow-lg)" },
};

const RAD: Record<Radius, string> = {
  sm: "var(--r-glass-sm)",
  md: "var(--r-glass-md)",
  lg: "var(--r-glass-lg)",
  xl: "var(--r-glass-xl)",
};

export default function GlassCard({
  elevation = 2,
  radius = "md",
  tint,
  interactive,
  specular = true,
  padding = "1.25rem",
  children,
  onClick,
  style,
}: {
  elevation?: Elevation;
  radius?: Radius;
  tint?: string;
  interactive?: boolean;
  specular?: boolean;
  padding?: string | number;
  children?: ReactNode;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  style?: CSSProperties;
}) {
  const [h, setH] = useState(false);
  const e = ELEV[elevation];
  const r = RAD[radius];
  const hoverable = !!interactive;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        position: "relative",
        borderRadius: r,
        background: h && hoverable ? "var(--glass-hover)" : e.fill,
        backdropFilter: "blur(var(--glass-blur)) saturate(var(--glass-saturate))",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(var(--glass-saturate))",
        border: "1px solid",
        borderColor: h && hoverable ? "var(--glass-border-strong)" : "var(--glass-border)",
        boxShadow: `var(--glass-edge), ${hoverable && h ? "var(--glass-shadow-lg)" : e.shadow}`,
        padding,
        color: "var(--glass-text)",
        cursor: hoverable ? "pointer" : "default",
        transition:
          "background var(--dur) var(--spring-soft), border-color var(--dur) var(--spring-soft), transform var(--dur) var(--spring), box-shadow var(--dur) var(--spring-soft)",
        transform: h && hoverable ? "translateY(-2px)" : "translateY(0)",
        overflow: "hidden",
        ...style,
      }}
    >
      {tint && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(120% 80% at 50% 0%, ${tint} 0%, transparent 60%)`,
            opacity: 0.16,
            pointerEvents: "none",
          }}
        />
      )}
      {specular && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "55%",
            background: "var(--glass-specular)",
            pointerEvents: "none",
            borderTopLeftRadius: r,
            borderTopRightRadius: r,
          }}
        />
      )}
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}
