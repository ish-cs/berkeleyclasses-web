"use client";

import type { CSSProperties } from "react";

type Option = string | { value: string; label: string };

function optVal(o: Option) {
  return typeof o === "string" ? o : o.value;
}
function optLabel(o: Option) {
  return typeof o === "string" ? o : o.label;
}

export default function SegmentedControl({
  options = [],
  value,
  onChange,
  style,
}: {
  options: Option[];
  value: string;
  onChange?: (v: string) => void;
  style?: CSSProperties;
}) {
  const n = Math.max(1, options.length);
  const idx = Math.max(0, options.findIndex((o) => optVal(o) === value));
  return (
    <div
      className="bc-seg"
      role="tablist"
      style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, ...style }}
    >
      <div
        aria-hidden
        className="bc-seg-thumb"
        style={{
          left: `calc(3px + ${idx} * ((100% - 6px) / ${n}))`,
          width: `calc((100% - 6px) / ${n})`,
        }}
      />
      {options.map((o) => {
        const v = optVal(o);
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(v)}
            className={["bc-seg-opt", active ? "bc-seg-opt--on" : null].filter(Boolean).join(" ")}
          >
            {optLabel(o)}
          </button>
        );
      })}
    </div>
  );
}
