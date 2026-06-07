import type { CSSProperties } from "react";

export default function GlassWordmark({
  size = "1.2rem",
  suffix = ".com",
  style,
}: {
  size?: string;
  suffix?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: size,
        letterSpacing: "-0.02em",
        color: "var(--glass-text)",
        ...style,
      }}
    >
      berkeleyclasses
      <span style={{ color: "var(--glass-text-faint)", fontWeight: 500 }}>{suffix}</span>
    </span>
  );
}
