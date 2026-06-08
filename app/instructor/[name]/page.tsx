import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Glass, Chip, SeatPill } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";
import type { Section } from "@/lib/types";

export const dynamic = "force-dynamic";

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

  // Split into current (active/filtered) and past terms
  const DEFAULT_TERM = "Fall 2026";
  const currentTermName = activeTerm || DEFAULT_TERM;
  const currentSections = sections.filter((s) => termById.get(s.term_id ?? "") === currentTermName);
  const pastSections = activeTerm
    ? []
    : sections.filter((s) => termById.get(s.term_id ?? "") !== currentTermName);

  const pastByCourse = new Map<string, Section[]>();
  for (const s of pastSections) {
    const key = `${termById.get(s.term_id ?? "") ?? "unknown"} · ${s.course_code ?? "(no course)"}`;
    if (!pastByCourse.has(key)) pastByCourse.set(key, []);
    pastByCourse.get(key)!.push(s);
  }

  return (
    <main className="bc-page">
      <GlassNav />

      <Glass className="bc-instructor-banner">
        <div className="bc-instructor-avatar" aria-hidden />
        <div>
          <Link
            href="/find"
            style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", display: "block", marginBottom: 8 }}
          >
            ← Back to search
          </Link>
          <h1 className="bc-instructor-name">{name}</h1>
          <p className="bc-instructor-meta">
            {sections.length} section{sections.length === 1 ? "" : "s"} · {distinctCourses.length} course
            {distinctCourses.length === 1 ? "" : "s"} · {distinctSubjects.length} subject
            {distinctSubjects.length === 1 ? "" : "s"}
            {activeTerm ? ` · ${activeTerm}` : ""}
          </p>
        </div>
      </Glass>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 60px" }}>
        {distinctTerms.length > 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "16px 0" }}>
            <Link href={`/instructor/${encodeURIComponent(name)}`} style={{ textDecoration: "none" }}>
              <Chip selected={!activeTerm} type="button" onClick={undefined}>All terms</Chip>
            </Link>
            {distinctTerms.map((t) => (
              <Link
                key={t}
                href={`/instructor/${encodeURIComponent(name)}?term=${encodeURIComponent(t)}`}
                style={{ textDecoration: "none" }}
              >
                <Chip selected={activeTerm === t} type="button" onClick={undefined}>{t}</Chip>
              </Link>
            ))}
          </div>
        )}

        {sections.length === 0 ? (
          <Glass style={{ padding: "40px 24px", textAlign: "center" as const }}>
            <p style={{ margin: 0, color: "var(--ink-strong)" }}>No sections found for {name}.</p>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)" }}>
              Try searching just a last name, or pick a different term.
            </p>
          </Glass>
        ) : (
          <>
            {currentSections.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: "16px 0 12px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, color: "var(--ink-strong)", letterSpacing: "var(--tracking-display)" }}>
                  {currentTermName}
                </h2>
                <Glass as="section" className="bc-results">
                  {currentSections.map((s) => {
                    const courseLine = [s.course_code, s.section_type, s.section_number].filter(Boolean).join(" ");
                    const meta = [
                      [s.meeting_days, s.meeting_time].filter(Boolean).join(" "),
                      s.location,
                      s.units ? `${s.units} units` : null,
                      `CCN ${s.ccn}`,
                    ].filter(Boolean).join(" · ");
                    return (
                      <article key={s.ccn} className="bc-row">
                        <Link href={`/class/${s.ccn}`}>
                          <div className="bc-row-code">{courseLine}{s.title ? ` — ${s.title}` : ""}</div>
                          <div className="bc-row-meta">{meta}</div>
                        </Link>
                        <SeatPill open={s.open_seats ?? 0} />
                      </article>
                    );
                  })}
                </Glass>
              </div>
            )}

            {pastSections.length > 0 && (
              <Glass as="details" className="bc-past-terms">
                <summary>
                  Past terms
                  <span style={{ fontFamily: "var(--font-mono-sf)", fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>
                    {pastSections.length} section{pastSections.length === 1 ? "" : "s"}
                  </span>
                </summary>
                <div className="bc-past-terms-body">
                  {[...pastByCourse.entries()].map(([label, items]) => (
                    <div key={label} style={{ marginBottom: 16 }}>
                      <h3 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                        {label}
                      </h3>
                      {items.map((s) => {
                        const courseLine = [s.course_code, s.section_type, s.section_number].filter(Boolean).join(" ");
                        return (
                          <div key={s.ccn} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "0.5px solid var(--hairline)", fontSize: 13, color: "var(--ink-strong)" }}>
                            <div>
                              <Link href={`/class/${s.ccn}`} style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}>{courseLine}</Link>
                              {s.title ? <span style={{ color: "var(--muted)", marginLeft: 8 }}>{s.title}</span> : null}
                            </div>
                            <span style={{ fontFamily: "var(--font-mono-sf)", fontSize: 11, color: "var(--muted)", marginLeft: 12 }}>
                              {s.meeting_days ?? "—"} {s.meeting_time ?? ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </Glass>
            )}
          </>
        )}
      </div>
    </main>
  );
}
