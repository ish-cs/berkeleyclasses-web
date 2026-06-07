import type { CSSProperties } from "react";

export default function SeatCapsule({
  seats = 0,
  size = "md",
  label = true,
  style,
}: {
  seats?: number;
  size?: "md" | "lg";
  label?: boolean;
  style?: CSSProperties;
}) {
  const open = seats > 0;
  if (size === "lg") {
    return (
      <span
        style={{
          textAlign: "center",
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.35rem",
          ...style,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono-sf)",
            fontSize: "2.75rem",
            fontWeight: 600,
            lineHeight: 1,
            padding: "0.5rem 1.1rem",
            borderRadius: "var(--r-glass-md)",
            background: open ? "var(--cap-open-fill)" : "var(--cap-closed-fill)",
            border: `1px solid ${open ? "var(--cap-open-border)" : "var(--cap-closed-border)"}`,
            color: open ? "var(--cap-open-text)" : "var(--cap-closed-text)",
            boxShadow: open
              ? "var(--cap-open-glow), inset 0 1px 0 rgba(255,255,255,0.25)"
              : "inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          {seats}
        </span>
        {label && <span style={{ fontSize: "0.75rem", color: "var(--glass-text-faint)" }}>open seats</span>}
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem", ...style }}>
      <span
        style={{
          fontFamily: "var(--font-mono-sf)",
          fontSize: "0.9375rem",
          fontWeight: 600,
          padding: "0.2rem 0.7rem",
          borderRadius: "var(--r-pill)",
          background: open ? "var(--cap-open-fill)" : "var(--cap-closed-fill)",
          border: `1px solid ${open ? "var(--cap-open-border)" : "var(--cap-closed-border)"}`,
          color: open ? "var(--cap-open-text)" : "var(--cap-closed-text)",
          boxShadow: open
            ? "var(--cap-open-glow), inset 0 1px 0 rgba(255,255,255,0.3)"
            : "inset 0 1px 0 rgba(255,255,255,0.18)",
        }}
      >
        {seats}
      </span>
      {label && (
        <span
          style={{
            fontSize: "0.625rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--glass-text-faint)",
          }}
        >
          open
        </span>
      )}
    </span>
  );
}
