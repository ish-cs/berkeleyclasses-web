import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/nav";
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
  mode?: string;          // in-person | online
  level?: string;         // lower | upper | grad
  type?: string;          // LEC | DIS | LAB (comma-separated)
  days?: string;          // Mo,We,Fr etc. comma-separated
  units?: string;         // exact match like "4" or "1-3"
  instructor?: string;
  req?: string;           // requirement designation code (e.g. AC)
  sort?: string;          // course_code_asc | course_code_desc | open_seats_desc | title_asc
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
  const req = params.req?.trim() ?? "";
  const sort = params.sort ?? "course_code_asc";

  const supabase = await createClient();

  const [{ data: terms }, { data: subjects }, { data: reqRows }] = await Promise.all([
    supabase.from("terms").select("term_id, name"),
    supabase.from("subjects").select("subject_id, name").order("name"),
    supabase
      .from("course_meta")
      .select("requirements")
      .not("requirements", "is", null),
  ]);

  // Canonical order matches classes.berkeley.edu sidebar so the filter feels
  // familiar to anyone coming from that page.
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
    const reqs = (row.requirements ?? []) as string[];
    for (const r of reqs) reqCounts.set(r, (reqCounts.get(r) ?? 0) + 1);
  }
  const reqOptions = REQUIREMENT_ORDER
    .filter((name) => reqCounts.has(name))
    .map((name) => ({ code: name, description: `${reqCounts.get(name)} courses` }));

  // Resolve req → course_code IN-list via the array-contains operator.
  let reqCourseCodes: string[] | null = null;
  if (req) {
    const { data: codes } = await supabase
      .from("course_meta")
      .select("course_code")
      .contains("requirements", [req]);
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

  // Client-side day filter (Supabase can't pattern-match arrays cleanly here)
  if (days.length > 0) {
    rows = rows.filter((r) => {
      if (!r.meeting_days) return false;
      const present = r.meeting_days.toLowerCase();
      return days.every((d) => present.includes(d.toLowerCase()));
    });
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Nav />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <FilterSidebar
            termGroups={groupTermsByYear(allTerms)}
            subjects={subjects ?? []}
            reqOptions={reqOptions}
            current={{
              q,
              term: termName,
              subject,
              openOnly,
              mode,
              level,
              types,
              days,
              units,
              instructor,
              req,
              sort,
            }}
          />
        </aside>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-semibold">Search</h1>
              <p className="text-sm text-zinc-500">
                {rows.length === RESULT_LIMIT
                  ? `Showing first ${RESULT_LIMIT} results — refine to narrow down`
                  : `${rows.length} result${rows.length === 1 ? "" : "s"}`}{" "}
                · term {termName}
              </p>
            </div>
            <SortSelect current={sort} />
          </div>

          {error && (
            <p className="rounded-md border border-red-900 bg-red-950 px-4 py-2 text-sm text-red-300 mb-4">
              {error.message}
            </p>
          )}

          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-800 px-6 py-16 text-center">
              <p className="text-zinc-300 mb-1">No sections match these filters.</p>
              <p className="text-sm text-zinc-500">
                Try removing a filter or pick another term.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((s) => (
                <SectionCard key={s.ccn} s={s} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SectionCard({ s }: { s: Section }) {
  const courseLine = [s.course_code, s.section_type, s.section_number].filter(Boolean).join(" ");
  return (
    <Link
      href={`/class/${s.ccn}`}
      className="block rounded-lg border border-zinc-900 hover:border-zinc-700 bg-zinc-950/50 hover:bg-zinc-950 transition-colors px-5 py-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 mb-1">
            CCN {s.ccn} · {s.subject_name ?? "—"}
          </p>
          <h2 className="font-semibold text-lg leading-tight">{courseLine}</h2>
          <p className="text-zinc-300 mt-0.5 truncate">{s.title}</p>
          <p className="text-sm text-zinc-500 mt-1 truncate">{s.instructors ?? "Staff"}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
            {s.meeting_days && <span>{s.meeting_days}</span>}
            {s.meeting_time && <span>{s.meeting_time}</span>}
            {s.location && <span className="text-zinc-500">{s.location}</span>}
            {s.units && <span className="text-zinc-500">{s.units} units</span>}
            {s.instruction_mode && (
              <span className="text-zinc-500">{s.instruction_mode}</span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            className={
              "inline-block rounded-md px-2.5 py-1 font-mono text-sm " +
              (s.open_seats > 0
                ? "bg-green-950 text-green-300 border border-green-900"
                : "bg-zinc-900 text-zinc-500 border border-zinc-800")
            }
          >
            {s.open_seats}
          </div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500 mt-1">open</p>
        </div>
      </div>
    </Link>
  );
}
