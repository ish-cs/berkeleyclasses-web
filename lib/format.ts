// canonical 2-letter day codes
const DAY_MAP: Record<string, string> = {
  mo: "Mo",
  tu: "Tu",
  we: "We",
  th: "Th",
  fr: "Fr",
  sa: "Sa",
  su: "Su",
};

export function parseMeetingDays(s: string | null | undefined): string[] {
  if (!s) return [];
  const normalized = s.replace(/[,/|·]/g, " ");
  const parts = normalized.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    const key = p.slice(0, 2).toLowerCase();
    const canon = DAY_MAP[key];
    if (canon && !seen.has(canon)) {
      seen.add(canon);
      out.push(canon);
    }
  }
  return out;
}

// "12:00 pm - 12:59 pm" → [720, 779]
export function parseMeetingTime(s: string | null | undefined): { start: number; end: number } | null {
  if (!s) return null;
  const cleaned = s.replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
  const parts = cleaned.split("-");
  if (parts.length !== 2) return null;
  const start = parseClock(parts[0]);
  const end = parseClock(parts[1]);
  if (start === null || end === null) return null;
  return { start, end };
}

function parseClock(s: string): number | null {
  const t = s.trim().toLowerCase();
  if (!t) return null;
  let suffix = "";
  let body = t;
  if (t.endsWith("am") || t.endsWith("pm")) {
    suffix = t.slice(-2);
    body = t.slice(0, -2).trim();
  }
  let hh = 0;
  let mm = 0;
  if (body.includes(":")) {
    const [hStr, mStr] = body.split(":");
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    hh = h;
    mm = m;
  } else {
    const h = parseInt(body, 10);
    if (Number.isNaN(h)) return null;
    hh = h;
  }
  if (suffix === "pm" && hh < 12) hh += 12;
  if (suffix === "am" && hh === 12) hh = 0;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

export function intersectDays(a: string[], b: string[]): string[] {
  const sa = new Set(a);
  return b.filter((d) => sa.has(d));
}

export function sectionsConflict(
  a: { meeting_days: string | null; meeting_time: string | null },
  b: { meeting_days: string | null; meeting_time: string | null },
): boolean {
  const daysA = parseMeetingDays(a.meeting_days);
  const daysB = parseMeetingDays(b.meeting_days);
  if (intersectDays(daysA, daysB).length === 0) return false;
  const ta = parseMeetingTime(a.meeting_time);
  const tb = parseMeetingTime(b.meeting_time);
  if (!ta || !tb) return false;
  return ta.start < tb.end && tb.start < ta.end;
}

export function fmtCourseLine(s: {
  course_code: string | null;
  section_type: string | null;
  section_number: string | null;
}): string {
  return [s.course_code, s.section_type, s.section_number].filter(Boolean).join(" ");
}
