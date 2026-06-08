import type { CSSProperties } from "react";
import { Glass } from "./Glass";

type Props = {
  value: string | number;
  label: string;
  accent?: string;
  tint?: string;
  style?: CSSProperties;
};

export function StatTile({ value, label, accent, tint, style }: Props) {
  return (
    <Glass className="bc-stat" style={style}>
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
      <div className="bc-stat-value" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="bc-stat-label">{label}</div>
    </Glass>
  );
}

export default StatTile;
