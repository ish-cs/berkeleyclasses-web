"use client";
import { useEffect } from "react";
import { useTheme } from "./use-theme";

export function MeshBackground({ children }: { children: React.ReactNode }) {
  useTheme();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    document.documentElement.dataset.reducedMotion = String(mq.matches);
    const handler = () => { document.documentElement.dataset.reducedMotion = String(mq.matches); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="mesh-root">
      <div className="mesh-wash mesh-wash-a" />
      <div className="mesh-wash mesh-wash-b" />
      <div className="mesh-wash mesh-wash-c" />
      <div className="mesh-content">{children}</div>
    </div>
  );
}
