import type { CSSProperties } from "react";
import GlassCard from "./GlassCard";

export default function StatTile({
  value,
  label,
  accent,
  tint,
  style,
}: {
  value: string | number;
  label: string;
  accent?: string;
  tint?: string;
  style?: CSSProperties;
}) {
  return (
    <GlassCard elevation={2} radius="md" tint={tint} padding="1.1rem 1.25rem" style={style}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "2.5rem",
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: "var(--tracking-display)",
          color: accent || "var(--glass-text)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: "0.45rem",
          fontSize: "0.8125rem",
          fontWeight: 500,
          color: "var(--glass-text-muted)",
        }}
      >
        {label}
      </div>
    </GlassCard>
  );
}
