import type { SectionSnapshot } from "@/lib/types";

const BT_GRAPHQL = "https://berkeleytime.com/api/graphql";

type BtHistoryPoint = {
  startTime: string;
  enrolledCount: number;
  waitlistedCount: number;
  maxEnroll: number;
  status: "O" | "C" | null;
};

type BtResponse = {
  data?: { enrollment?: { history?: BtHistoryPoint[] } | null };
  errors?: unknown;
};

const QUERY = `query($year:Int!,$semester:Semester!,$subject:String!,$courseNumber:CourseNumber!,$sectionNumber:SectionNumber!){
  enrollment(year:$year,semester:$semester,subject:$subject,courseNumber:$courseNumber,sectionNumber:$sectionNumber){
    history { startTime enrolledCount waitlistedCount maxEnroll status }
  }
}`;

export function parseCourseCode(courseCode: string): { subject: string; number: string } | null {
  const m = courseCode.trim().match(/^([A-Z]+(?:\s+[A-Z]+)?)\s+([A-Z0-9]+)$/i);
  if (!m) return null;
  return { subject: m[1].toUpperCase().replace(/\s+/g, " "), number: m[2].toUpperCase() };
}

export async function fetchEnrollmentHistory(opts: {
  courseCode: string;
  sectionNumber: string;
  ccn: number;
  year: number;
  semester: "Fall" | "Spring" | "Summer" | "Winter";
}): Promise<SectionSnapshot[] | null> {
  const parsed = parseCourseCode(opts.courseCode);
  if (!parsed) {
    console.warn("[bt] parseCourseCode failed for", opts.courseCode);
    return null;
  }
  try {
    const res = await fetch(BT_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: QUERY,
        variables: {
          year: opts.year,
          semester: opts.semester,
          subject: parsed.subject,
          courseNumber: parsed.number,
          sectionNumber: opts.sectionNumber,
        },
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("[bt] http fail", res.status, await res.text().catch(() => ""));
      return null;
    }
    const body = (await res.json()) as BtResponse & { errors?: Array<{ message: string }> };
    if (body.errors) {
      console.warn("[bt] graphql errors", JSON.stringify(body.errors).slice(0, 400), "for", parsed, opts.sectionNumber);
      return null;
    }
    const history = body?.data?.enrollment?.history;
    if (!history || history.length === 0) {
      console.info("[bt] no history for", parsed, opts.sectionNumber, opts.year, opts.semester);
      return null;
    }
    return history.map((h) => ({
      ccn: opts.ccn,
      taken_at: Math.floor(new Date(h.startTime).getTime() / 1000),
      open_seats: Math.max(0, h.maxEnroll - h.enrolledCount),
      enrolled: h.enrolledCount,
      waitlisted: h.waitlistedCount,
      capacity: h.maxEnroll,
    }));
  } catch (e) {
    console.error("[bt] fetch threw", String(e));
    return null;
  }
}

export function termNameToYearSemester(termName: string): { year: number; semester: "Fall" | "Spring" | "Summer" | "Winter" } | null {
  const m = termName.trim().match(/^(Fall|Spring|Summer|Winter)\s+(\d{4})$/i);
  if (!m) return null;
  const sem = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  if (sem !== "Fall" && sem !== "Spring" && sem !== "Summer" && sem !== "Winter") return null;
  return { year: parseInt(m[2], 10), semester: sem };
}
