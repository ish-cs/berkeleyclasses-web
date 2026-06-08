"use client";
import { useState } from "react";

type Props = { initial?: boolean; onToggle?: (next: boolean) => void; label?: string };

export function StarButton({ initial = false, onToggle, label = "Save" }: Props) {
  const [on, setOn] = useState(initial);
  return (
    <button
      type="button"
      className={["bc-star", on ? "bc-star--on" : null].filter(Boolean).join(" ")}
      aria-pressed={on}
      aria-label={label}
      onClick={() => { const next = !on; setOn(next); onToggle?.(next); }}
    >
      <span className="bc-btn-spec" aria-hidden />
      <span className="bc-star-glyph">{on ? "★" : "☆"}</span>
    </button>
  );
}
