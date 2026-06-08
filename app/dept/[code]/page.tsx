import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Glass, Button, Chip, StatTile } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";
import type { Section } from "@/lib/types";
import { sortTermsByYear, isRealTerm } from "@/lib/terms";

export const dynamic = "force-dynamic";

const DEFAULT_TERM = "Fall 2026";

type CourseAgg = {
  course_code: string;
  section_count: number;
  open_seats: number;
  capacity: number;
  enrolled: number;
  sample_title: string;
};

export default async function DeptPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ term?: string }>;
}) {
  const { code: rawCode } = await params;
  const { term: termParam } = await searchParams;
  const code = decodeURIComponent(rawCode).trim();
  if (!code) notFound();
  const termName = termParam?.trim() || DEFAULT_TERM;

  const supabase = await createClient();
  const [{ data: termRow }, { data: terms }] = await Promise.all([
    supabase.from("terms").select("term_id, name").ilike("name", termName).maybeSingle(),
    supabase.from("terms").select("term_id, name"),
  ]);

  if (!termRow) {
    return (
      <main className="bc-page">
        <GlassNav />
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 24px" }}>
          <p style={{ color: "var(--muted)" }}>Term &ldquo;{termName}&rdquo; not found.</p>
        </div>
      </main>
    );
  }

  const upper = code.toUpperCase();
  let { data: rows } = await supabase
    .from("sections")
    .select("*")
    .eq("term_id", termRow.term_id)
    .or(`subject_name.ilike.%${code}%,course_code.ilike.${upper} %,course_code.ilike.${upper}%`)
    .order("course_code")
    .limit(2000);

  let sections = (rows ?? []) as Section[];
  if (sections.length === 0) {
    const fallback = await supabase
      .from("sections")
      .select("*")
      .eq("term_id", termRow.term_id)
      .ilike("subject_name", `%${code}%`)
      .limit(2000);
    sections = (fallback.data ?? []) as Section[];
  }
  if (sections.length === 0) notFound();

  const byCourse = new Map<string, CourseAgg>();
  const instructorCounts = new Map<string, number>();
  let totalOpen = 0;
  let totalCap = 0;
  let totalEnrolled = 0;
  for (const s of sections) {
    totalOpen += s.open_seats;
    totalCap += s.capacity;
    totalEnrolled += s.enrolled;
    const k = s.course_code ?? "(no code)";
    const agg = byCourse.get(k) ?? {
      course_code: k,
      section_count: 0,
      open_seats: 0,
      capacity: 0,
      enrolled: 0,
      sample_title: s.title ?? "",
    };
    agg.section_count += 1;
    agg.open_seats += s.open_seats;
    agg.capacity += s.capacity;
    agg.enrolled += s.enrolled;
    if (!agg.sample_title && s.title) agg.sample_title = s.title;
    byCourse.set(k, agg);

    if (s.instructors) {
      for (const part of s.instructors.split(/[;,]/)) {
        const nm = part.trim();
        if (!nm || /^(staff|tba)$/i.test(nm)) continue;
        instructorCounts.set(nm, (instructorCounts.get(nm) ?? 0) + 1);
      }
    }
  }

  const topInstructors = [...instructorCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8);
  const courses = [...byCourse.values()].sort((a, b) => a.course_code.localeCompare(b.course_code));
  const subjectName = sections[0].subject_name ?? code;

  return (
    <main className="bc-page">
      <GlassNav />

      <Glass className="bc-dept-header">
        <Link
          href="/find"
          style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", display: "block", marginBottom: 16 }}
        >
          ← Back to search
        </Link>
        <div className="bc-eyebrow">Department</div>
        <h1 className="bc-dept-name">{subjectName}</h1>
        <p className="bc-dept-summary">
          {sections.length} sections · {courses.length} courses ·{" "}
          <span style={{ color: totalOpen > 0 ? "var(--cap-open-text)" : "var(--muted)" }}>
            {totalOpen} open seats
          </span>{" "}
          · {termRow.name}
        </p>
        <div className="bc-dept-breadth">
          {sortTermsByYear((terms ?? []).filter((t) => isRealTerm(t.name))).map((t) => (
            <Link key={t.term_id} href={`/dept/${encodeURIComponent(code)}?term=${encodeURIComponent(t.name)}`} style={{ textDecoration: "none" }}>
              <Chip selected={t.name === termName} type="button" onClick={undefined}>
                {t.name}
              </Chip>
            </Link>
          ))}
        </div>
      </Glass>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatTile value={sections.length} label="Sections" />
          <StatTile value={courses.length} label="Courses" />
          <StatTile
            value={totalOpen}
            label="Open seats"
            accent={totalOpen > 0 ? "var(--cap-open-text)" : undefined}
          />
          <StatTile
            value={totalCap > 0 ? `${Math.round((100 * totalEnrolled) / totalCap)}%` : "—"}
            label="Fill rate"
          />
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}
        >
          <div>
            <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--ink-strong)", letterSpacing: "var(--tracking-display)" }}>
              Courses offered
            </h2>
            <Glass as="section" className="bc-results">
              {courses.map((c, i) => (
                <Link
                  key={c.course_code}
                  href={`/find?term=${encodeURIComponent(termRow.name)}&q=${encodeURIComponent(c.course_code)}`}
                  className="bc-row"
                  style={{ textDecoration: "none", color: "inherit", display: "block" }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="bc-row-code">{c.course_code}</div>
                      <div className="bc-row-meta">{c.sample_title}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, fontSize: 12, fontFamily: "var(--font-mono-sf)", color: "var(--muted)" }}>
                      <div>{c.section_count} sec</div>
                      <div style={{ color: c.open_seats > 0 ? "var(--cap-open-text)" : "var(--muted)" }}>
                        {c.open_seats} open
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </Glass>
          </div>

          <div>
            <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--ink-strong)", letterSpacing: "var(--tracking-display)" }}>
              Top instructors
            </h2>
            {topInstructors.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>No instructors found in this term yet.</p>
            ) : (
              <Glass as="section" className="bc-results">
                {topInstructors.map(([nm, count]) => (
                  <Link
                    key={nm}
                    href={`/instructor/${encodeURIComponent(nm)}?term=${encodeURIComponent(termRow.name)}`}
                    className="bc-row"
                    style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <div className="bc-row-code">{nm}</div>
                    <span style={{ fontFamily: "var(--font-mono-sf)", fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>
                      {count} section{count === 1 ? "" : "s"}
                    </span>
                  </Link>
                ))}
              </Glass>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
