import { parseMeetingDays, parseMeetingTime } from "@/lib/format";
import type { Section } from "@/lib/types";

const DAYS: { code: string; label: string }[] = [
  { code: "Mo", label: "Mon" },
  { code: "Tu", label: "Tue" },
  { code: "We", label: "Wed" },
  { code: "Th", label: "Thu" },
  { code: "Fr", label: "Fri" },
];

const PALETTE = [
  "bg-blue-500/20 border-blue-500/40 text-blue-100",
  "bg-emerald-500/20 border-emerald-500/40 text-emerald-100",
  "bg-violet-500/20 border-violet-500/40 text-violet-100",
  "bg-amber-500/20 border-amber-500/40 text-amber-100",
  "bg-rose-500/20 border-rose-500/40 text-rose-100",
  "bg-cyan-500/20 border-cyan-500/40 text-cyan-100",
  "bg-pink-500/20 border-pink-500/40 text-pink-100",
];

function fmtClock(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const h12 = ((h24 + 11) % 12) + 1;
  const ampm = h24 >= 12 ? "p" : "a";
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}

export default function ScheduleGrid({
  sections,
  colorBy = "course_code",
}: {
  sections: Section[];
  colorBy?: "course_code" | "ccn";
}) {
  const placed = sections
    .map((s) => {
      const days = parseMeetingDays(s.meeting_days).filter((d) => DAYS.some((x) => x.code === d));
      const time = parseMeetingTime(s.meeting_time);
      return time && days.length > 0 ? { s, days, time } : null;
    })
    .filter(Boolean) as { s: Section; days: string[]; time: { start: number; end: number } }[];

  if (placed.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 px-6 py-10 text-center text-sm text-zinc-500">
        No timed meetings — all sections are async / TBA.
      </div>
    );
  }

  const minStart = Math.min(...placed.map((p) => p.time.start));
  const maxEnd = Math.max(...placed.map((p) => p.time.end));
  const startHour = Math.max(7, Math.floor(minStart / 60));
  const endHour = Math.min(22, Math.ceil(maxEnd / 60));
  const totalMin = (endHour - startHour) * 60;

  // Stable color assignment
  const keyFor = (s: Section) => (colorBy === "ccn" ? String(s.ccn) : s.course_code ?? String(s.ccn));
  const colorMap = new Map<string, string>();
  let idx = 0;
  for (const p of placed) {
    const k = keyFor(p.s);
    if (!colorMap.has(k)) colorMap.set(k, PALETTE[idx++ % PALETTE.length]);
  }

  return (
    <div className="rounded-lg border border-zinc-900 overflow-x-auto">
      <div className="min-w-[560px]">
      <div className="grid grid-cols-[48px_repeat(5,1fr)] text-xs">
        <div />
        {DAYS.map((d) => (
          <div key={d.code} className="px-2 py-1.5 text-zinc-400 border-l border-zinc-900 font-medium">
            {d.label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[48px_repeat(5,1fr)] relative" style={{ height: `${totalMin * 0.9}px` }}>
        <div className="border-r border-zinc-900">
          {Array.from({ length: endHour - startHour }).map((_, i) => {
            const h = startHour + i;
            const h12 = ((h + 11) % 12) + 1;
            const ampm = h >= 12 ? "p" : "a";
            return (
              <div
                key={h}
                className="text-[10px] text-zinc-600 pr-1 text-right border-t border-zinc-900/70"
                style={{ height: `${60 * 0.9}px` }}
              >
                {h12}{ampm}
              </div>
            );
          })}
        </div>
        {DAYS.map((d) => (
          <div key={d.code} className="relative border-l border-zinc-900">
            {Array.from({ length: endHour - startHour }).map((_, i) => (
              <div key={i} className="border-t border-zinc-900/70" style={{ height: `${60 * 0.9}px` }} />
            ))}
            {placed
              .filter((p) => p.days.includes(d.code))
              .map((p) => {
                const top = (p.time.start - startHour * 60) * 0.9;
                const height = Math.max(20, (p.time.end - p.time.start) * 0.9);
                const color = colorMap.get(keyFor(p.s)) ?? PALETTE[0];
                return (
                  <div
                    key={`${p.s.ccn}-${d.code}`}
                    className={`absolute left-0.5 right-0.5 rounded border px-1.5 py-1 text-[10px] leading-tight overflow-hidden ${color}`}
                    style={{ top: `${top}px`, height: `${height}px` }}
                    title={`${p.s.course_code} ${p.s.section_type} ${p.s.section_number} — ${p.s.title ?? ""}`}
                  >
                    <div className="font-semibold truncate">
                      {p.s.course_code} {p.s.section_type}
                    </div>
                    <div className="opacity-80 truncate">
                      {fmtClock(p.time.start)}–{fmtClock(p.time.end)}
                    </div>
                    {p.s.location && <div className="opacity-70 truncate">{p.s.location}</div>}
                  </div>
                );
              })}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
