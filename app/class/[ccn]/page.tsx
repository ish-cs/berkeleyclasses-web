import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Glass, Button, SeatPill } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";
import GradeHistogram from "@/components/grade-histogram";
import WaitlistTrend from "@/components/waitlist-trend";
import { SaveSectionButton } from "@/components/save-section-button";
import { extractPrereqs } from "@/lib/prereqs";
import { fetchEnrollmentHistory, termNameToYearSemester } from "@/lib/berkeleytime";
import type { CourseMeta, Section, SectionSnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ClassPage({
  params,
}: {
  params: Promise<{ ccn: string }>;
}) {
  const { ccn } = await params;
  const ccnNum = parseInt(ccn, 10);
  if (Number.isNaN(ccnNum) || ccnNum <= 0) notFound();

  const supabase = await createClient();
  const { data: section } = await supabase.from("sections").select("*").eq("ccn", ccnNum).maybeSingle();
  if (!section) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  let isSaved = false;
  if (user) {
    const { data: sav } = await supabase
      .from("saved_sections")
      .select("ccn")
      .eq("user_id", user.id)
      .eq("ccn", String(ccnNum))
      .maybeSingle();
    isSaved = !!sav;
  }
  const s = section as Section;

  const [{ data: siblings }, { data: metaRow }, { data: snapshotRows }, { data: termRow }] = await Promise.all([
    supabase
      .from("sections")
      .select("ccn, section_type, section_number, instructors, meeting_days, meeting_time, open_seats")
      .eq("course_code", s.course_code ?? "")
      .eq("term_id", s.term_id ?? "")
      .neq("ccn", ccnNum)
      .order("section_number")
      .limit(40),
    s.course_code
      ? supabase.from("course_meta").select("*").eq("course_code", s.course_code).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("section_snapshots")
      .select("ccn, taken_at, open_seats, enrolled, waitlisted, capacity")
      .eq("ccn", ccnNum)
      .order("taken_at", { ascending: true })
      .limit(200),
    supabase.from("terms").select("name").eq("term_id", s.term_id ?? "").maybeSingle(),
  ]);
  const meta = (metaRow ?? null) as CourseMeta | null;
  const localSnapshots = (snapshotRows ?? []) as SectionSnapshot[];

  // Prefer Berkeleytime's months-of-history; fall back to our own snapshots if BT lookup fails
  const termName = (termRow as { name?: string } | null)?.name ?? "Fall 2026";
  const ys = termNameToYearSemester(termName);
  let snapshots: SectionSnapshot[] = localSnapshots;
  if (ys && s.course_code && s.section_number) {
    const bt = await fetchEnrollmentHistory({
      courseCode: s.course_code,
      sectionNumber: s.section_number,
      ccn: ccnNum,
      year: ys.year,
      semester: ys.semester,
    });
    if (bt && bt.length > 0) snapshots = bt;
  }
  const prereqs = extractPrereqs({
    metaText: meta?.prereq_text,
    requiredCourses: meta?.required_courses,
    description: s.description,
  });

  // Instructor links
  const instructorNodes = s.instructors
    ? s.instructors
        .split(/[;,]/)
        .map((n) => n.trim())
        .filter(Boolean)
        .map((name, i, arr) => (
          <span key={name + i}>
            <Link
              href={`/instructor/${encodeURIComponent(name)}`}
              style={{ color: "var(--ink-strong)", textDecoration: "underline", textDecorationColor: "var(--hairline)" }}
            >
              {name}
            </Link>
            {i < arr.length - 1 && ", "}
          </span>
        ))
    : null;

  return (
    <main className="bc-page">
      <GlassNav />

      {/* Back link */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px" }}>
        <Link
          href="/find"
          style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", display: "inline-block", marginBottom: 12 }}
        >
          ← Back to search
        </Link>
      </div>

      {/* Hero */}
      <Glass className="bc-class-hero">
        <div className="bc-class-hero-head">
          <div style={{ minWidth: 0 }}>
            <div className="bc-class-code">
              {s.course_code} · {s.section_type} {s.section_number} · CCN {s.ccn}
              {s.subject_name && (
                <>
                  {" · "}
                  <Link href={`/dept/${encodeURIComponent(s.subject_name)}`} style={{ color: "var(--muted)", textDecoration: "none" }}>
                    {s.subject_name}
                  </Link>
                </>
              )}
            </div>
            <h1 className="bc-class-title">{s.title}</h1>
            <div className="bc-class-meta">
              {instructorNodes && <strong>{instructorNodes}</strong>}
              {s.meeting_days && <span>{s.meeting_days}{s.meeting_time ? ` ${s.meeting_time}` : ""}</span>}
              {s.location && <span>{s.location}</span>}
              {s.units && <span>{s.units} units</span>}
              {s.instruction_mode && <span>{s.instruction_mode}</span>}
              <SeatPill open={s.open_seats ?? 0} waitlist={s.waitlisted ?? 0} />
            </div>
          </div>
          <SaveSectionButton ccn={String(ccnNum)} initial={isSaved} />
        </div>

        {/* Requirements + prereq pills */}
        {((meta?.requirements && meta.requirements.length > 0) || prereqs.courses.length > 0) && (
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(meta?.requirements ?? []).map((r) => (
              <Link
                key={r}
                href={`/find?reqs=${encodeURIComponent(r)}`}
                title="Satisfies this UC Berkeley general requirement"
                style={{
                  padding: "3px 10px",
                  borderRadius: "var(--r-pill)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--cap-warn-text)",
                  background: "var(--cap-warn-fill)",
                  border: "1px solid var(--cap-warn-border)",
                  textDecoration: "none",
                }}
              >
                {r}
              </Link>
            ))}
            {prereqs.courses.map((c) => (
              <span
                key={`${c.subject} ${c.number}`}
                title="Prerequisite"
                style={{
                  padding: "3px 10px",
                  borderRadius: "var(--r-pill)",
                  fontSize: 11,
                  background: "var(--glass-1)",
                  border: "0.5px solid var(--glass-border)",
                  color: "var(--muted)",
                }}
              >
                prereq {c.subject} {c.number}
              </span>
            ))}
          </div>
        )}
        {prereqs.text && prereqs.courses.length === 0 && (
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
            <span style={{ color: "var(--muted)" }}>Prereq: </span>{prereqs.text}
          </p>
        )}
      </Glass>

      {/* 3-col grid */}
      <div className="bc-class-grid">
        {/* Enrollment */}
        <Glass className="bc-class-panel">
          <h3>Enrollment</h3>
          {s.capacity > 0 && (
            <div className="bc-enroll-row">
              <span className="label">Capacity</span>
              <span className="val">{s.capacity}</span>
            </div>
          )}
          {s.enrolled != null && (
            <div className="bc-enroll-row">
              <span className="label">Enrolled</span>
              <span className="val">{s.enrolled}</span>
            </div>
          )}
          <div className="bc-enroll-row">
            <span className="label">Open seats</span>
            <span className="val" style={{ color: (s.open_seats ?? 0) > 0 ? "var(--cap-open-text)" : undefined }}>
              {s.open_seats ?? 0}
            </span>
          </div>
          {(s.waitlisted ?? 0) > 0 && (
            <div className="bc-enroll-row">
              <span className="label">Waitlisted</span>
              <span className="val">{s.waitlisted}</span>
            </div>
          )}
          {s.meeting_dates && (
            <div className="bc-enroll-row">
              <span className="label">Dates</span>
              <span className="val">{s.meeting_dates}</span>
            </div>
          )}
          <div className="bc-watch-cta">
            <Link href={`/compare?a=${s.ccn}`}>
              <Button variant="default" size="sm">Compare →</Button>
            </Link>
            <Link href={`/watch?ccn=${s.ccn}`}>
              <Button variant="primary" size="sm">Watch for open seats</Button>
            </Link>
          </div>
        </Glass>

        {/* Grade distribution */}
        <Glass className="bc-class-panel">
          <h3>Grade distribution</h3>
          {meta?.grade_distribution && meta.grade_distribution.length > 0 ? (
            <GradeHistogram
              distribution={meta.grade_distribution}
              average={meta.grade_average}
              sampleSize={meta.grade_sample_size}
            />
          ) : (
            <div className="bc-histogram-empty">No grade history.</div>
          )}
        </Glass>

        {/* Prereqs & watch */}
        <Glass className="bc-class-panel">
          <h3>Prereqs &amp; info</h3>
          {prereqs.text ? (
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, margin: "0 0 12px" }}>
              {prereqs.text}
            </p>
          ) : prereqs.courses.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px" }}>No prerequisites listed.</p>
          ) : null}
          {prereqs.courses.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              {prereqs.courses.map((c) => (
                <span
                  key={`${c.subject} ${c.number}`}
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: "var(--r-pill)",
                    background: "var(--glass-1)",
                    border: "0.5px solid var(--glass-border)",
                    color: "var(--muted)",
                    width: "fit-content",
                  }}
                >
                  {c.subject} {c.number}
                </span>
              ))}
            </div>
          )}
          {s.description && (
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, margin: 0, whiteSpace: "pre-wrap" }}>
              {s.description}
            </p>
          )}
        </Glass>
      </div>

      {/* Waitlist trend — full width */}
      <Glass className="bc-class-panel" style={{ marginTop: 0 }}>
        <WaitlistTrend
          snapshots={snapshots}
          current={{ open_seats: s.open_seats ?? 0, waitlisted: s.waitlisted ?? 0, capacity: s.capacity ?? 0 }}
        />
      </Glass>

      {/* Other sections */}
      {siblings && siblings.length > 0 && (
        <Glass className="bc-related">
          <h3>Other sections of {s.course_code}</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "var(--muted)", textAlign: "left" }}>
                  <Th>CCN</Th>
                  <Th>Type</Th>
                  <Th>Sec</Th>
                  <Th>Instructors</Th>
                  <Th>Days / Time</Th>
                  <Th right>Open</Th>
                </tr>
              </thead>
              <tbody>
                {siblings.map((sib) => (
                  <tr key={sib.ccn} style={{ borderTop: "0.5px solid var(--hairline)" }}>
                    <Td>
                      <Link href={`/class/${sib.ccn}`} style={{ color: "var(--ink-strong)", textDecoration: "none" }}>
                        {sib.ccn}
                      </Link>
                    </Td>
                    <Td>{sib.section_type}</Td>
                    <Td>{sib.section_number}</Td>
                    <Td truncate>{sib.instructors ?? ""}</Td>
                    <Td>
                      {sib.meeting_days ?? "—"}
                      {sib.meeting_time ? ` · ${sib.meeting_time}` : ""}
                    </Td>
                    <Td right>
                      <span style={{ color: sib.open_seats > 0 ? "var(--cap-open-text)" : "var(--muted)" }}>
                        {sib.open_seats}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Glass>
      )}
    </main>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      style={{
        textAlign: right ? "right" : "left",
        padding: "6px 10px",
        fontWeight: 600,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--muted)",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  right,
  truncate,
}: {
  children: React.ReactNode;
  right?: boolean;
  truncate?: boolean;
}) {
  return (
    <td
      style={{
        padding: "8px 10px",
        textAlign: right ? "right" : "left",
        color: "var(--ink)",
        whiteSpace: truncate ? "nowrap" : undefined,
        overflow: truncate ? "hidden" : undefined,
        textOverflow: truncate ? "ellipsis" : undefined,
        maxWidth: truncate ? "20ch" : undefined,
      }}
    >
      {children}
    </td>
  );
}
