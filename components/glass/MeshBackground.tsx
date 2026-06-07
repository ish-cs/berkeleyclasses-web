import type { CSSProperties, ReactNode } from "react";

export default function MeshBackground({
  animated = true,
  children,
  style,
}: {
  animated?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{ position: "relative", minHeight: "100%", background: "var(--mesh-base)", ...style }}>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          pointerEvents: "none",
          background: "var(--mesh-ink)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-20%",
            background:
              "radial-gradient(40% 50% at 22% 28%, var(--mesh-blue) 0%, transparent 60%)," +
              "radial-gradient(45% 55% at 78% 30%, var(--mesh-gold) 0%, transparent 55%)," +
              "radial-gradient(50% 60% at 30% 85%, var(--mesh-purple) 0%, transparent 60%)",
            animation: animated ? "meshDrift var(--mesh-drift) ease-in-out infinite" : "none",
            willChange: "transform",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "-20%",
            opacity: 0.8,
            background:
              "radial-gradient(45% 55% at 68% 72%, var(--mesh-blue-deep) 0%, transparent 60%)," +
              "radial-gradient(35% 45% at 50% 50%, var(--mesh-purple) 0%, transparent 70%)",
            animation: animated ? "meshDrift2 calc(var(--mesh-drift) * 1.4) ease-in-out infinite" : "none",
            willChange: "transform",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(120% 120% at 50% 0%, transparent 55%, rgba(0,0,0,0.55) 100%)",
          }}
        />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
