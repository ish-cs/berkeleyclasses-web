"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { GlassSelect } from "@/components/glass";

const OPTIONS: Array<{ value: string; label: string }> = [
  { value: "course_code_asc", label: "Course · A→Z" },
  { value: "course_code_desc", label: "Course · Z→A" },
  { value: "open_seats_desc", label: "Open seats" },
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
    <div className="bc-sort-row">
      <span className="bc-sr-label">Sort</span>
      <GlassSelect value={current} onChange={(e) => update(e.target.value)} style={{ width: "auto" }}>
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </GlassSelect>
    </div>
  );
}
