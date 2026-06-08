"use client";

import { useState, forwardRef, type CSSProperties, type ReactNode, type MouseEvent } from "react";
import { Glass } from "./Glass";

type Elevation = 1 | 2 | 3;
type Radius = "sm" | "md" | "lg" | "xl";

const RAD: Record<Radius, string> = {
  sm: "var(--r-glass-sm)",
  md: "var(--r-glass-md)",
  lg: "var(--r-glass-lg)",
  xl: "var(--r-glass-xl)",
};

type Props = {
  elevation?: Elevation;
  radius?: Radius;
  tint?: string;
  interactive?: boolean;
  specular?: boolean;
  padding?: string | number;
  children?: ReactNode;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  style?: CSSProperties;
  className?: string;
};

export const GlassCard = forwardRef<HTMLDivElement, Props>(function GlassCard(
  { elevation = 2, radius = "md", tint, interactive, specular = true, padding = "1.25rem", children, onClick, style, className },
  ref,
) {
  const [h, setH] = useState(false);
  const r = RAD[radius];
  return (
    <Glass
      ref={ref as React.Ref<HTMLElement>}
      spec={specular}
      onClick={onClick as React.MouseEventHandler<HTMLElement>}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      className={["bc-glass-card", `bc-glass-card--e${elevation}`, interactive ? "bc-glass-card--interactive" : null, h && interactive ? "bc-glass-card--hover" : null, className].filter(Boolean).join(" ")}
      style={{ borderRadius: r, padding, ...style }}
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
      <div style={{ position: "relative" }}>{children}</div>
    </Glass>
  );
});

export default GlassCard;
