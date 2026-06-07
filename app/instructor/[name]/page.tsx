import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {  GlassCard } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";
import type { Section } from "@/lib/types";

export const dynamic = "force-dynamic";

const WRAP: React.CSSProperties = { maxWidth: "1080px", margin: "0 auto", padding: "1.75rem 1.5rem 4rem" };
const display = (size: string, weight = 600): React.CSSProperties => ({
  fontFamily: "var(--font-display)",
  fontWeight: weight,
  letterSpacing: "var(--tracking-display)",
  fontSize: size,
});
const text: React.CSSProperties = { fontFamily: "var(--font-text)", color: "var(--glass-text-muted)" };
const mono: React.CSSProperties = { fontFamily: "var(--font-mono-sf)" };

export default async function InstructorPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ term?: string }>;
}) {
  const { name: nameRaw } = await params;
  const { term: termFilter } = await searchParams;
  const name = decodeURIComponent(nameRaw).trim();
  if (!name) notFound();

  const supabase = await createClient();
  const [{ data: terms }, { data: rows }] = await Promise.all([
    supabase.from("terms").select("term_id, name").order("name"),
    supabase
      .from("sections")
      .select(
        "ccn, course_code, section_type, section_number, title, instructors, units, meeting_days, meeting_time, location, open_seats, term_id, subject_name",
      )
      .ilike("instructors", `%${name}%`)
      .order("course_code")
      .limit(500),
  ]);

  const termById = new Map((terms ?? []).map((t) => [t.term_id, t.name] as const));
  let sections = (rows ?? []) as Section[];

  const activeTerm = termFilter?.trim() ?? "";
  if (activeTerm) {
    sections = sections.filter((s) => termById.get(s.term_id ?? "") === activeTerm);
  }

  const distinctTerms = Array.from(
    new Set(sections.map((s) => termById.get(s.term_id ?? "")).filter(Boolean) as string[]),
  );
  const distinctSubjects = Array.from(new Set(sections.map((s) => s.subject_name).filter(Boolean) as string[]));
  const distinctCourses = Array.from(new Set(sections.map((s) => s.course_code).filter(Boolean) as string[]));

  const byCourse = new Map<string, Section[]>();
  for (const s of sections) {
    const key = s.course_code ?? "(no course)";
    if (!byCourse.has(key)) byCourse.set(key, []);
    byCourse.get(key)!.push(s);
  }

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
            Instructor
          </p>
          <h1 style={{ margin: "0.3rem 0 0", ...display("2rem"), color: "var(--glass-text)" }}>{name}</h1>
          <p style={{ margin: "0.4rem 0 0", ...text }}>
            {sections.length} section{sections.length === 1 ? "" : "s"} · {distinctCourses.length} course
            {distinctCourses.length === 1 ? "" : "s"} · {distinctSubjects.length} subject
            {distinctSubjects.length === 1 ? "" : "s"}
            {activeTerm ? ` · ${activeTerm}` : ""}
          </p>
        </div>

        {distinctTerms.length > 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "2rem" }}>
            <TermPill href={`/instructor/${encodeURIComponent(name)}`} active={!activeTerm}>
              All terms
            </TermPill>
            {distinctTerms.map((t) => (
              <TermPill
                key={t}
                href={`/instructor/${encodeURIComponent(name)}?term=${encodeURIComponent(t)}`}
                active={activeTerm === t}
              >
                {t}
              </TermPill>
            ))}
          </div>
        )}

        {sections.length === 0 ? (
          <GlassCard elevation={1} radius="lg" padding="3rem 1.5rem" specular={false}>
            <p style={{ margin: 0, textAlign: "center", color: "var(--glass-text)" }}>
              No sections found for {name}.
            </p>
            <p style={{ margin: "0.5rem 0 0", textAlign: "center", ...text, fontSize: "0.875rem" }}>
              Try searching just a last name, or pick a different term.
            </p>
          </GlassCard>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {[...byCourse.entries()].map(([course, items]) => (
              <GlassCard key={course} elevation={1} radius="lg" padding={0}>
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: "1px solid var(--glass-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <h2 style={{ margin: 0, ...display("1.1rem"), color: "var(--glass-text)" }}>{course}</h2>
                  <span style={{ fontSize: "0.7rem", color: "var(--glass-text-faint)", ...mono }}>
                    {items.length} section{items.length === 1 ? "" : "s"}
                  </span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-text)", fontSize: "0.875rem" }}>
                  <tbody>
                    {items.map((s, i) => (
                      <tr key={s.ccn} style={{ borderTop: i === 0 ? "none" : "1px solid var(--glass-border)" }}>
                        <td style={{ padding: "0.55rem 1.25rem 0.55rem 1.25rem", ...mono, color: "var(--glass-text-faint)" }}>
                          <Link href={`/class/${s.ccn}`} style={{ color: "var(--glass-text-faint)", textDecoration: "none" }}>
                            {s.ccn}
                          </Link>
                        </td>
                        <td style={{ padding: "0.55rem 0.5rem", color: "var(--glass-text)" }}>
                          {s.section_type} {s.section_number}
                        </td>
                        <td
                          style={{
                            padding: "0.55rem 0.5rem",
                            color: "var(--glass-text-muted)",
                            maxWidth: "30ch",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.title}
                        </td>
                        <td style={{ padding: "0.55rem 0.5rem", color: "var(--glass-text-muted)", whiteSpace: "nowrap" }}>
                          {s.meeting_days ?? "—"}
                        </td>
                        <td style={{ padding: "0.55rem 0.5rem", color: "var(--glass-text-muted)", whiteSpace: "nowrap" }}>
                          {s.meeting_time ?? "async"}
                        </td>
                        <td style={{ padding: "0.55rem 1.25rem 0.55rem 0.5rem", textAlign: "right", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              ...mono,
                              color: s.open_seats > 0 ? "var(--cap-open-text)" : "var(--glass-text-faint)",
                            }}
                          >
                            {s.open_seats}
                          </span>
                          <span style={{ fontSize: "0.625rem", color: "var(--glass-text-faint)", marginLeft: "0.35rem" }}>
                            open
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function TermPill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
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
      {children}
    </Link>
  );
}
