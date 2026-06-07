"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const OPTIONS: Array<{ value: string; label: string }> = [
  { value: "course_code_asc", label: "Course code · A→Z" },
  { value: "course_code_desc", label: "Course code · Z→A" },
  { value: "open_seats_desc", label: "Open seats · high→low" },
  { value: "title_asc", label: "Title · A→Z" },
];

export default function SortSelect({ current }: { current: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function update(v: string) {
    const p = new URLSearchParams(sp.toString());
    if (v === "course_code_asc") p.delete("sort");
    else p.set("sort", v);
    startTransition(() => router.replace(`/find?${p.toString()}`, { scroll: false }));
  }

  return (
    <label className={`flex items-center gap-2 text-sm ${isPending ? "opacity-70" : ""}`}>
      <span className="text-zinc-500">Sort</span>
      <select
        value={current}
        onChange={(e) => update(e.target.value)}
        className="rounded-md bg-zinc-900 border border-zinc-800 px-3 py-1.5 outline-none focus:border-zinc-500"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
