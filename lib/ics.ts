import { parseMeetingDays, parseMeetingTime } from "./format";
import type { Section } from "./types";

const ICS_DAY: Record<string, string> = {
  Mo: "MO",
  Tu: "TU",
  We: "WE",
  Th: "TH",
  Fr: "FR",
  Sa: "SA",
  Su: "SU",
};

function fold(line: string): string {
  // RFC 5545 lines must be ≤ 75 octets; fold continuation lines with CRLF + space.
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let i = 0;
  while (i < line.length) {
    const slice = line.slice(i, i + 73);
    chunks.push(i === 0 ? slice : " " + slice);
    i += 73;
  }
  return chunks.join("\r\n");
}

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

// "Aug 26, 2026 - Dec 11, 2026" → { start: "20260826", end: "20261211" }
function parseDateRange(s: string | null | undefined): { start: string; end: string } | null {
  if (!s) return null;
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const matches = [...s.matchAll(/([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/g)];
  if (matches.length < 2) return null;
  const fmt = (m: RegExpMatchArray) => {
    const mon = months[m[1].slice(0, 3).toLowerCase()];
    if (mon === undefined) return null;
    const d = parseInt(m[2], 10);
    const y = parseInt(m[3], 10);
    if (Number.isNaN(d) || Number.isNaN(y)) return null;
    return `${y}${String(mon + 1).padStart(2, "0")}${String(d).padStart(2, "0")}`;
  };
  const start = fmt(matches[0]);
  const end = fmt(matches[matches.length - 1]);
  if (!start || !end) return null;
  return { start, end };
}

// Find the first occurrence of `dayCode` (e.g. "MO") on or after startYYYYMMDD.
function shiftToFirstDay(startYYYYMMDD: string, dayCode: string): string {
  const y = parseInt(startYYYYMMDD.slice(0, 4), 10);
  const m = parseInt(startYYYYMMDD.slice(4, 6), 10) - 1;
  const d = parseInt(startYYYYMMDD.slice(6, 8), 10);
  const dt = new Date(Date.UTC(y, m, d));
  const target = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"].indexOf(dayCode);
  if (target < 0) return startYYYYMMDD;
  let safety = 7;
  while (dt.getUTCDay() !== target && safety-- > 0) dt.setUTCDate(dt.getUTCDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}`;
}

function hhmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
}

function sectionEvents(s: Section, dtstamp: string): string[] {
  const days = parseMeetingDays(s.meeting_days);
  const time = parseMeetingTime(s.meeting_time);
  const range = parseDateRange(s.meeting_dates);
  if (days.length === 0 || !time || !range) return [];

  const byday = days.map((d) => ICS_DAY[d]).filter(Boolean);
  if (byday.length === 0) return [];

  // Pick the BYDAY that resolves to the *earliest* date on/after range.start —
  // otherwise multi-day classes (e.g. Tu/Th, starting on a Wednesday) would
  // skip the very first meeting.
  let firstDay = shiftToFirstDay(range.start, byday[0]);
  for (const d of byday.slice(1)) {
    const candidate = shiftToFirstDay(range.start, d);
    if (candidate < firstDay) firstDay = candidate;
  }
  const start = `${firstDay}T${hhmm(time.start)}`;
  const end = `${firstDay}T${hhmm(time.end)}`;
  const until = `${range.end}T235959`;
  const summary = esc([s.course_code, s.section_type, s.section_number].filter(Boolean).join(" "));
  const desc = esc(s.title ?? "");
  const loc = esc(s.location ?? "");

  const lines = [
    "BEGIN:VEVENT",
    `UID:berkeleyclasses-${s.ccn}@berkeleyclasses.com`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=America/Los_Angeles:${start}`,
    `DTEND;TZID=America/Los_Angeles:${end}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${byday.join(",")};UNTIL=${until}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${loc}`,
    "END:VEVENT",
  ];
  return lines.map(fold);
}

const VTIMEZONE_LA = [
  "BEGIN:VTIMEZONE",
  "TZID:America/Los_Angeles",
  "BEGIN:STANDARD",
  "DTSTART:19701101T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
  "TZOFFSETFROM:-0700",
  "TZOFFSETTO:-0800",
  "TZNAME:PST",
  "END:STANDARD",
  "BEGIN:DAYLIGHT",
  "DTSTART:19700308T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
  "TZOFFSETFROM:-0800",
  "TZOFFSETTO:-0700",
  "TZNAME:PDT",
  "END:DAYLIGHT",
  "END:VTIMEZONE",
];

export function buildIcs(sections: Section[]): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dtstamp =
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T` +
    `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//berkeleyclasses.com//Schedule Export//EN",
    "CALSCALE:GREGORIAN",
    ...VTIMEZONE_LA,
  ];
  for (const s of sections) lines.push(...sectionEvents(s, dtstamp));
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export function untimedSections(sections: Section[]): Section[] {
  return sections.filter((s) => {
    const days = parseMeetingDays(s.meeting_days);
    const time = parseMeetingTime(s.meeting_time);
    return days.length === 0 || !time;
  });
}
