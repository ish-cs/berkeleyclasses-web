import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Glass, Button, SeatPill } from "@/components/glass";
import { SaveSectionButton } from "@/components/save-section-button";
import GlassNav from "@/components/glass/GlassNav";
import type { Section } from "@/lib/types";
import FilterSidebar from "./filter-sidebar";
import SortSelect from "./sort-select";
import { groupTermsByYear, resolveTermIds } from "@/lib/terms";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  term?: string;
  subject?: string;
  open?: string;
  mode?: string;
  level?: string;
  type?: string;
  days?: string;
  units?: string;
  instructor?: string;
  req?: string;
  reqs?: string;
  sort?: string;
};

const DEFAULT_TERM = "Fall 2026";
const RESULT_LIMIT = 300;

export default async function FindPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const termName = params.term?.trim() || DEFAULT_TERM;
  const subject = params.subject?.trim() ?? "";
  const openOnly = params.open === "1";
  const mode = params.mode?.trim() ?? "";
  const level = params.level?.trim() ?? "";
  const types = (params.type ?? "").split(",").filter(Boolean);
  const days = (params.days ?? "").split(",").filter(Boolean);
  const units = params.units?.trim() ?? "";
  const instructor = params.instructor?.trim() ?? "";
  const reqs = (params.reqs ?? params.req ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const sort = params.sort ?? "course_code_asc";

  const supabase = await createClient();

  const [{ data: terms }, { data: subjects }, { data: reqRows }] = await Promise.all([
    supabase.from("terms").select("term_id, name"),
    supabase.from("subjects").select("subject_id, name").order("name"),
    supabase.from("course_meta").select("requirements").not("requirements", "is", null),
  ]);

  const REQUIREMENT_ORDER = [
    "American Cultures",
    "American Hist & Institutions",
    "Arts & Literature",
    "Biological Science",
    "Entry Level Writing",
    "Historical Studies",
    "International Studies",
    "Philosophy & Values",
    "Physical Science",
    "Reading and Composition A",
    "Reading and Composition B",
    "Social & Behavioral Sciences",
  ];
  const reqCounts = new Map<string, number>();
  for (const row of reqRows ?? []) {
    const rs = (row.requirements ?? []) as string[];
    for (const r of rs) reqCounts.set(r, (reqCounts.get(r) ?? 0) + 1);
  }
  const reqOptions = REQUIREMENT_ORDER.filter((name) => reqCounts.has(name)).map((name) => ({
    code: name,
    description: `${reqCounts.get(name)} courses`,
  }));

  let reqCourseCodes: string[] | null = null;
  if (reqs.length > 0) {
    const { data: codes } = await supabase
      .from("course_meta")
      .select("course_code")
      .overlaps("requirements", reqs);
    reqCourseCodes = (codes ?? []).map((c) => c.course_code as string).filter(Boolean);
    if (reqCourseCodes.length === 0) reqCourseCodes = ["__none__"];
  }

  const allTerms = terms ?? [];
  const termIds = resolveTermIds(allTerms, termName);

  let query = supabase
    .from("sections")
    .select(
      "ccn, course_code, course_number, section_type, section_number, title, instructors, units, instruction_mode, meeting_days, meeting_time, location, open_seats, capacity, subject_name, description",
    )
    .limit(RESULT_LIMIT);

  if (termIds.length === 1) query = query.eq("term_id", termIds[0]);
  else if (termIds.length > 1) query = query.in("term_id", termIds);
  if (subject) query = query.ilike("subject_name", `%${subject}%`);
  if (openOnly) query = query.gt("open_seats", 0);
  if (mode === "in-person") query = query.ilike("instruction_mode", "%in-person%");
  if (mode === "online") query = query.ilike("instruction_mode", "%online%");
  if (level === "lower") query = query.lt("course_number", "100");
  if (level === "upper") query = query.gte("course_number", "100").lt("course_number", "200");
  if (level === "grad") query = query.gte("course_number", "200");
  if (types.length > 0) query = query.in("section_type", types);
  if (units) query = query.eq("units", units);
  if (instructor) query = query.ilike("instructors", `%${instructor}%`);
  if (reqCourseCodes) query = query.in("course_code", reqCourseCodes);
  if (q) {
    const esc = q.replace(/,/g, " ");
    query = query.or(
      `course_code.ilike.%${esc}%,title.ilike.%${esc}%,instructors.ilike.%${esc}%,description.ilike.%${esc}%`,
    );
  }

  const sortMap: Record<string, [string, boolean]> = {
    course_code_asc: ["course_code", true],
    course_code_desc: ["course_code", false],
    open_seats_desc: ["open_seats", false],
    title_asc: ["title", true],
  };
  const [sortCol, sortAsc] = sortMap[sort] ?? sortMap["course_code_asc"];
  query = query.order(sortCol, { ascending: sortAsc, nullsFirst: false });

  const { data: rowsRaw, error } = await query;
  let rows: Section[] = (rowsRaw ?? []) as Section[];

  if (days.length > 0) {
    rows = rows.filter((r) => {
      if (!r.meeting_days) return false;
      const present = r.meeting_days.toLowerCase();
      return days.every((d) => present.includes(d.toLowerCase()));
    });
  }

  const { data: { user } } = await supabase.auth.getUser();
  const savedCcns = new Set<string>();
  if (user && rows.length > 0) {
    const ccnList = rows.map((r) => String(r.ccn));
    const { data: savedRows } = await supabase
      .from("saved_sections")
      .select("ccn")
      .eq("user_id", user.id)
      .in("ccn", ccnList);
    for (const row of savedRows ?? []) savedCcns.add(String(row.ccn));
  }

  return (
    <main className="bc-page">
      <GlassNav active="/find" />

      <Glass className="bc-hero">
        <div className="bc-eyebrow">UC Berkeley · {termName}</div>
        <h1 className="bc-h1">Find <span className="bc-h1-accent">your</span> classes.</h1>
        <form className="bc-hero-form" action="/find" method="get">
          <input name="q" className="bc-input" placeholder="course, instructor, CCN, keyword…" defaultValue={q} />
          <input type="hidden" name="term" value={termName} />
          {openOnly && <input type="hidden" name="open" value="1" />}
          <Button type="submit" variant="primary">Search</Button>
        </form>
      </Glass>

      <div className="bc-grid2">
        <FilterSidebar
          termGroups={groupTermsByYear(allTerms)}
          subjects={subjects ?? []}
          reqOptions={reqOptions}
          current={{ q, term: termName, subject, openOnly, mode, level, types, days, units, instructor, reqs, sort }}
        />

        <Glass as="section" className="bc-results">
          <header className="bc-results-head">
            <h2>
              {subject || "All subjects"} · {rows.length}
              {rows.length === RESULT_LIMIT ? "+" : ""} section{rows.length === 1 ? "" : "s"}
            </h2>
            <SortSelect current={sort} />
          </header>

          {error && <p className="bc-muted" style={{ color: "var(--cap-conflict-text, #b91c1c)" }}>{error.message}</p>}

          {rows.length === 0 ? (
            <p className="bc-muted">No sections match these filters. Remove a filter or pick another term.</p>
          ) : (
            rows.map((s) => <SectionRow key={s.ccn} s={s} saved={savedCcns.has(String(s.ccn))} />)
          )}
        </Glass>
      </div>
    </main>
  );
}

function SectionRow({ s, saved }: { s: Section; saved: boolean }) {
  const courseLine = [s.course_code, s.section_type, s.section_number].filter(Boolean).join(" ");
  const meta = [
    s.instructors ?? "Staff",
    [s.meeting_days, s.meeting_time].filter(Boolean).join(" "),
    s.location,
    s.units ? `${s.units} units` : null,
    `CCN ${s.ccn}`,
  ].filter(Boolean).join(" · ");

  return (
    <article className="bc-row">
      <Link href={`/class/${s.ccn}`}>
        <div className="bc-row-code">{courseLine}{s.title ? ` — ${s.title}` : ""}</div>
        <div className="bc-row-meta">{meta}</div>
      </Link>
      <SeatPill open={s.open_seats ?? 0} />
      <SaveSectionButton ccn={String(s.ccn)} initial={saved} />
    </article>
  );
}
