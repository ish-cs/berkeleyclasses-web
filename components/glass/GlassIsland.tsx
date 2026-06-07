import type { CSSProperties, ReactNode } from "react";

export default function GlassIsland({
  children,
  visible = true,
  style,
}: {
  children: ReactNode;
  visible?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: "1.5rem",
        transform: visible ? "translate(-50%, 0)" : "translate(-50%, 160%)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.6rem 0.7rem 0.6rem 1.25rem",
        borderRadius: "var(--r-pill)",
        background: "rgba(18,22,34,0.6)",
        backdropFilter: "blur(var(--glass-blur-strong)) saturate(var(--glass-saturate))",
        WebkitBackdropFilter: "blur(var(--glass-blur-strong)) saturate(var(--glass-saturate))",
        border: "1px solid var(--glass-border-strong)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), var(--glass-shadow-lg)",
        transition: "transform var(--dur-slow) var(--spring)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
