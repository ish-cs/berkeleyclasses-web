import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {  GlassCard, StatTile } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";
import type { Section } from "@/lib/types";
import { sortTermsByYear, isRealTerm } from "@/lib/terms";

export const dynamic = "force-dynamic";

const DEFAULT_TERM = "Fall 2026";

const WRAP: React.CSSProperties = { maxWidth: "1080px", margin: "0 auto", padding: "1.75rem 1.5rem 4rem" };
const display = (size: string, weight = 600): React.CSSProperties => ({
  fontFamily: "var(--font-display)",
  fontWeight: weight,
  letterSpacing: "var(--tracking-display)",
  fontSize: size,
});
const text: React.CSSProperties = { fontFamily: "var(--font-text)", color: "var(--glass-text-muted)" };
const mono: React.CSSProperties = { fontFamily: "var(--font-mono-sf)" };

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
      <>
        <GlassNav />
        <main style={WRAP}>
          <p style={{ color: "var(--glass-text-muted)", ...text }}>Term &ldquo;{termName}&rdquo; not found.</p>
        </main>
      </>
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
        const name = part.trim();
        if (!name || /^(staff|tba)$/i.test(name)) continue;
        instructorCounts.set(name, (instructorCounts.get(name) ?? 0) + 1);
      }
    }
  }

  const topInstructors = [...instructorCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8);
  const courses = [...byCourse.values()].sort((a, b) => a.course_code.localeCompare(b.course_code));
  const subjectName = sections[0].subject_name ?? code;

  return (
    <>
      <GlassNav />
      <section style={WRAP}>
        <Link
          href="/find"
          style={{ ...text, fontSize: "0.875rem", color: "var(--glass-text-faint)", textDecoration: "none" }}
        >
          ← Back to search
        </Link>

        <div style={{ margin: "1rem 0 1.5rem" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--glass-text-faint)",
              fontFamily: "var(--font-text)",
            }}
          >
            Department
          </p>
          <h1 style={{ margin: "0.3rem 0 0", ...display("2rem"), color: "var(--glass-text)" }}>{subjectName}</h1>
          <p style={{ margin: "0.4rem 0 0", ...text }}>
            {sections.length} sections · {courses.length} courses ·{" "}
            <span style={{ color: totalOpen > 0 ? "var(--cap-open-text)" : "var(--glass-text-muted)" }}>
              {totalOpen} open seats
            </span>{" "}
            · {termRow.name}
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "2rem" }}>
          {sortTermsByYear((terms ?? []).filter((t) => isRealTerm(t.name))).map((t) => {
            const active = t.name === termName;
            return (
              <Link
                key={t.term_id}
                href={`/dept/${encodeURIComponent(code)}?term=${encodeURIComponent(t.name)}`}
                style={{
                  padding: "0.3rem 0.85rem",
                  borderRadius: "var(--r-pill)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  fontFamily: "var(--font-text)",
                  textDecoration: "none",
                  background: active
                    ? "linear-gradient(180deg, rgba(74,144,217,0.5), rgba(0,50,98,0.6))"
                    : "var(--glass-1)",
                  color: active ? "#fff" : "var(--glass-text-muted)",
                  border: active ? "1px solid rgba(120,180,240,0.55)" : "1px solid var(--glass-border)",
                }}
              >
                {t.name}
              </Link>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
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
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}
        >
          <div>
            <h2 style={{ margin: "0 0 0.85rem", ...display("1.25rem"), color: "var(--glass-text)" }}>
              Courses offered
            </h2>
            <GlassCard elevation={1} radius="lg" padding={0}>
              {courses.map((c, i) => (
                <Link
                  key={c.course_code}
                  href={`/find?term=${encodeURIComponent(termRow.name)}&q=${encodeURIComponent(c.course_code)}`}
                  style={{
                    display: "block",
                    padding: "0.85rem 1rem",
                    borderTop: i === 0 ? "none" : "1px solid var(--glass-border)",
                    textDecoration: "none",
                    color: "var(--glass-text)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.85rem" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontFamily: "var(--font-text)", fontWeight: 600 }}>{c.course_code}</p>
                      <p
                        style={{
                          margin: "0.2rem 0 0",
                          fontSize: "0.75rem",
                          color: "var(--glass-text-faint)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {c.sample_title}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, fontSize: "0.75rem", ...mono }}>
                      <p style={{ margin: 0, color: "var(--glass-text-muted)" }}>{c.section_count} sec</p>
                      <p style={{ margin: 0, color: c.open_seats > 0 ? "var(--cap-open-text)" : "var(--glass-text-faint)" }}>
                        {c.open_seats} open
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </GlassCard>
          </div>

          <div>
            <h2 style={{ margin: "0 0 0.85rem", ...display("1.25rem"), color: "var(--glass-text)" }}>Top instructors</h2>
            {topInstructors.length === 0 ? (
              <p style={{ ...text, fontSize: "0.875rem" }}>No instructors found in this term yet.</p>
            ) : (
              <GlassCard elevation={1} radius="lg" padding={0}>
                {topInstructors.map(([name, count], i) => (
                  <Link
                    key={name}
                    href={`/instructor/${encodeURIComponent(name)}?term=${encodeURIComponent(termRow.name)}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.85rem 1rem",
                      borderTop: i === 0 ? "none" : "1px solid var(--glass-border)",
                      textDecoration: "none",
                      color: "var(--glass-text)",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-text)" }}>{name}</span>
                    <span style={{ ...mono, fontSize: "0.8125rem", color: "var(--glass-text-faint)" }}>
                      {count} section{count === 1 ? "" : "s"}
                    </span>
                  </Link>
                ))}
              </GlassCard>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
