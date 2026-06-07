"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { GlassSelect } from "@/components/glass";

const OPTIONS: Array<{ value: string; label: string }> = [
  { value: "course_code_asc", label: "Course code · A→Z" },
  { value: "course_code_desc", label: "Course code · Z→A" },
  { value: "open_seats_desc", label: "Open seats · high→low" },
  { value: "title_asc", label: "Title · A→Z" },
];

export default function SortSelect({ current }: { current: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  function update(v: string) {
    const p = new URLSearchParams(sp.toString());
    if (v === "course_code_asc") p.delete("sort");
    else p.set("sort", v);
    startTransition(() => router.replace(`/find?${p.toString()}`, { scroll: false }));
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
      <span
        style={{
          fontFamily: "var(--font-text)",
          fontSize: "0.8125rem",
          color: "var(--glass-text-faint)",
          whiteSpace: "nowrap",
        }}
      >
        Sort
      </span>
      <GlassSelect
        value={current}
        onChange={(e) => update(e.target.value)}
        style={{ width: "auto", padding: "0.45rem 0.85rem", fontSize: "0.875rem" }}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </GlassSelect>
    </div>
  );
}
