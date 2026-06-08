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
  "primary",
  "gold",
  "primary",
  "primary",
  "gold",
  "primary",
  "primary",
];

const PIXEL_PER_MIN = 0.9;

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
    return <div className="bc-schedule-empty">No timed meetings — all sections are async / TBA.</div>;
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
    <div className="bc-grid-shell">
      <div className="bc-grid-head">
        <div />
        {DAYS.map((d) => (
          <div key={d.code}>{d.label}</div>
        ))}
      </div>
      <div className="bc-grid-body" style={{ height: `${totalMin * PIXEL_PER_MIN}px` }}>
        <div className="bc-grid-hours">
          {Array.from({ length: endHour - startHour }).map((_, i) => {
            const h = startHour + i;
            const h12 = ((h + 11) % 12) + 1;
            const ampm = h >= 12 ? "p" : "a";
            return (
              <div key={h} className="bc-grid-hour" style={{ height: `${60 * PIXEL_PER_MIN}px` }}>
                {h12}{ampm}
              </div>
            );
          })}
        </div>
        {DAYS.map((d) => (
          <div key={d.code} className="bc-grid-day">
            {Array.from({ length: endHour - startHour }).map((_, i) => (
              <div key={i} className="bc-grid-day-row" style={{ height: `${60 * PIXEL_PER_MIN}px` }} />
            ))}
            {placed
              .filter((p) => p.days.includes(d.code))
              .map((p, i) => {
                const top = (p.time.start - startHour * 60) * PIXEL_PER_MIN;
                const height = Math.max(20, (p.time.end - p.time.start) * PIXEL_PER_MIN);
                const isGold = colorMap.get(keyFor(p.s)) === "gold";
                return (
                  <div
                    key={`${p.s.ccn}-${d.code}-${i}`}
                    className={["bc-grid-event", isGold ? "bc-grid-event--gold" : null].filter(Boolean).join(" ")}
                    style={{ top: `${top}px`, height: `${height}px` }}
                    title={`${p.s.course_code} ${p.s.section_type} ${p.s.section_number} — ${p.s.title ?? ""}`}
                  >
                    <div className="bc-grid-event-title">{p.s.course_code} {p.s.section_type}</div>
                    <div className="bc-grid-event-time">{fmtClock(p.time.start)}–{fmtClock(p.time.end)}</div>
                    {p.s.location && <div className="bc-grid-event-loc">{p.s.location}</div>}
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
