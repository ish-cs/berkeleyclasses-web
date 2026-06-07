import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {  GlassCard, SeatCapsule } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";
import type { Section } from "@/lib/types";
import { subjectAccent } from "@/lib/accent";
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

const WRAP: React.CSSProperties = { maxWidth: "1240px", margin: "0 auto", padding: "0 1.5rem" };
const display = (size: string, weight = 600): React.CSSProperties => ({
  fontFamily: "var(--font-display)",
  fontWeight: weight,
  letterSpacing: "var(--tracking-display)",
  fontSize: size,
});
const mono: React.CSSProperties = { fontFamily: "var(--font-mono-sf)" };

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

  return (
    <>
      <GlassNav />
      <main style={{ ...WRAP, padding: "2rem 1.5rem 4rem" }}>
        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "minmax(0, 280px) minmax(0, 1fr)",
          }}
          className="bc-find-layout"
        >
          <aside style={{ position: "sticky", top: "5.25rem", alignSelf: "flex-start" }}>
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
                reqs,
                sort,
              }}
            />
          </aside>

          <section>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              <div>
                <h1 style={{ margin: 0, ...display("1.75rem"), color: "var(--glass-text)" }}>Search</h1>
                <p
                  style={{
                    margin: "0.35rem 0 0",
                    fontFamily: "var(--font-text)",
                    fontSize: "0.875rem",
                    color: "var(--glass-text-faint)",
                  }}
                >
                  {rows.length === RESULT_LIMIT
                    ? `Showing first ${RESULT_LIMIT} results — refine to narrow down`
                    : `${rows.length} result${rows.length === 1 ? "" : "s"}`}
                  {" · "}term {termName}
                </p>
              </div>
              <SortSelect current={sort} />
            </div>

            {error && (
              <div style={{ marginBottom: "1rem" }}>
                <GlassCard elevation={1} radius="sm" padding="0.75rem 1rem" specular={false}>
                  <p style={{ margin: 0, color: "var(--cap-conflict-text)" }}>{error.message}</p>
                </GlassCard>
              </div>
            )}

            {rows.length === 0 ? (
              <GlassCard elevation={1} radius="lg" padding="3rem 1.5rem" specular={false}>
                <p style={{ margin: 0, color: "var(--glass-text)", textAlign: "center" }}>
                  No sections match these filters.
                </p>
                <p
                  style={{
                    margin: "0.5rem 0 0",
                    fontSize: "0.875rem",
                    color: "var(--glass-text-faint)",
                    textAlign: "center",
                  }}
                >
                  Try removing a filter or pick another term.
                </p>
              </GlassCard>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {rows.map((s) => (
                  <SectionCard key={s.ccn} s={s} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <style>{`
        @media (max-width: 1024px) {
          .bc-find-layout { grid-template-columns: 1fr !important; }
          .bc-find-layout > aside { position: static !important; }
        }
      `}</style>
    </>
  );
}

function SectionCard({ s }: { s: Section }) {
  const courseLine = [s.course_code, s.section_type, s.section_number].filter(Boolean).join(" ");
  const meta = [
    s.meeting_days,
    s.meeting_time,
    s.location,
    s.units ? `${s.units} units` : null,
    s.instruction_mode,
  ].filter(Boolean) as string[];
  return (
    <Link href={`/class/${s.ccn}`} style={{ textDecoration: "none", color: "inherit" }}>
      <GlassCard
        interactive
        elevation={1}
        radius="md"
        tint={subjectAccent(s.subject_name)}
        padding="1.05rem 1.25rem"
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: "0 0 0.3rem",
                ...mono,
                fontSize: "0.75rem",
                color: "var(--glass-text-faint)",
              }}
            >
              CCN {s.ccn} · {s.subject_name ?? "—"}
            </p>
            <h3 style={{ margin: 0, ...display("1.15rem"), color: "var(--glass-text)" }}>{courseLine}</h3>
            <p
              style={{
                margin: "0.15rem 0 0",
                fontFamily: "var(--font-text)",
                color: "var(--glass-text)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {s.title}
            </p>
            <p
              style={{
                margin: "0.3rem 0 0",
                fontFamily: "var(--font-text)",
                fontSize: "0.875rem",
                color: "var(--glass-text-faint)",
              }}
            >
              {s.instructors ?? "Staff"}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.3rem 1rem",
                marginTop: "0.6rem",
                fontSize: "0.875rem",
                color: "var(--glass-text-muted)",
                fontFamily: "var(--font-text)",
              }}
            >
              {meta.map((m, j) => (
                <span key={j} style={j > 1 ? { color: "var(--glass-text-faint)" } : undefined}>
                  {m}
                </span>
              ))}
            </div>
          </div>
          <SeatCapsule seats={s.open_seats ?? 0} />
        </div>
      </GlassCard>
    </Link>
  );
}
