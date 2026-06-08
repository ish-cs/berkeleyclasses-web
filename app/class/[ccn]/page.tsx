import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {  GlassCard, GlassButton, SeatCapsule } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";
import GradeHistogram from "@/components/grade-histogram";
import WaitlistTrend from "@/components/waitlist-trend";
import { StarButton } from "@/components/glass";
import { extractPrereqs } from "@/lib/prereqs";
import { subjectAccent } from "@/lib/accent";
import type { CourseMeta, Section, SectionSnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

const WRAP: React.CSSProperties = { maxWidth: "920px", margin: "0 auto", padding: "1.75rem 1.5rem 4rem" };
const display = (size: string, weight = 600): React.CSSProperties => ({
  fontFamily: "var(--font-display)",
  fontWeight: weight,
  letterSpacing: "var(--tracking-display)",
  fontSize: size,
});
const text: React.CSSProperties = { fontFamily: "var(--font-text)", color: "var(--glass-text-muted)" };
const mono: React.CSSProperties = { fontFamily: "var(--font-mono-sf)" };

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
  const s = section as Section;

  const [{ data: siblings }, { data: metaRow }, { data: snapshotRows }] = await Promise.all([
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
  ]);
  const meta = (metaRow ?? null) as CourseMeta | null;
  const snapshots = (snapshotRows ?? []) as SectionSnapshot[];
  const prereqs = extractPrereqs({
    metaText: meta?.prereq_text,
    requiredCourses: meta?.required_courses,
    description: s.description,
  });
  const accent = subjectAccent(s.subject_name);

  const stats: { label: string; value: string | number | null; accent?: string }[] = [
    { label: "Units", value: s.units },
    { label: "Meeting days", value: s.meeting_days },
    { label: "Meeting time", value: s.meeting_time },
    { label: "Location", value: s.location },
    { label: "Mode", value: s.instruction_mode },
    { label: "Dates", value: s.meeting_dates },
  ];
  if (s.capacity > 0) {
    stats.push({
      label: "Enrollment",
      value: `${s.enrolled} / ${s.capacity}${s.waitlisted ? ` · ${s.waitlisted} wl` : ""}`,
      accent: s.open_seats > 0 ? "var(--cap-open-text)" : undefined,
    });
  }

  return (
    <>
      <GlassNav />
      <section style={WRAP}>
        <Link
          href="/find"
          style={{
            ...text,
            fontSize: "0.875rem",
            color: "var(--glass-text-faint)",
            display: "inline-block",
            marginBottom: "1rem",
            textDecoration: "none",
          }}
        >
          ← Back to search
        </Link>

        <GlassCard elevation={2} radius="lg" padding="2rem" tint={accent}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: "0 0 0.4rem", ...mono, fontSize: "0.8rem", color: "var(--glass-text-faint)" }}>
                CCN {s.ccn} ·{" "}
                {s.subject_name ? (
                  <Link
                    href={`/dept/${encodeURIComponent(s.subject_name)}`}
                    style={{ color: "var(--glass-text-muted)", textDecoration: "none" }}
                  >
                    {s.subject_name}
                  </Link>
                ) : (
                  "—"
                )}
              </p>
              <h1 style={{ margin: 0, ...display("2rem"), color: "var(--glass-text)" }}>
                {s.course_code} {s.section_type} {s.section_number}
              </h1>
              <p style={{ margin: "0.4rem 0 0", ...text, fontSize: "1.15rem", color: "var(--glass-text)" }}>{s.title}</p>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
              <StarButton />
              <SeatCapsule seats={s.open_seats ?? 0} size="lg" />
            </div>
          </div>

          {((meta?.requirements && meta.requirements.length > 0) || prereqs.courses.length > 0) && (
            <div
              style={{
                marginTop: "1.25rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.4rem",
                alignItems: "center",
              }}
            >
              {(meta?.requirements ?? []).map((r) => (
                <Link
                  key={r}
                  href={`/find?reqs=${encodeURIComponent(r)}`}
                  title="Satisfies this UC Berkeley general requirement"
                  style={{
                    padding: "0.25rem 0.7rem",
                    borderRadius: "var(--r-pill)",
                    fontSize: "0.75rem",
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
                    padding: "0.25rem 0.7rem",
                    borderRadius: "var(--r-pill)",
                    fontSize: "0.75rem",
                    background: "var(--glass-1)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--glass-text)",
                  }}
                >
                  <span style={{ color: "var(--glass-text-faint)" }}>prereq </span>
                  <span style={mono}>
                    {c.subject} {c.number}
                  </span>
                </span>
              ))}
            </div>
          )}
          {prereqs.text && prereqs.courses.length === 0 && (
            <p style={{ marginTop: "0.9rem", ...text, fontSize: "0.875rem" }}>
              <span style={{ color: "var(--glass-text-faint)" }}>Prereq: </span>
              {prereqs.text}
            </p>
          )}

          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "0.7rem",
              margin: "1.75rem 0 0",
            }}
          >
            <Stat
              label="Instructors"
              value={
                s.instructors
                  ? s.instructors
                      .split(/[;,]/)
                      .map((n) => n.trim())
                      .filter(Boolean)
                      .map((name, i, arr) => (
                        <span key={name + i}>
                          <Link
                            href={`/instructor/${encodeURIComponent(name)}`}
                            style={{ color: "var(--glass-text)", textDecoration: "underline", textDecorationColor: "var(--glass-border-strong)" }}
                          >
                            {name}
                          </Link>
                          {i < arr.length - 1 && ", "}
                        </span>
                      ))
                  : "—"
              }
            />
            {stats.map((st) => (
              <Stat key={st.label} label={st.label} value={st.value} accent={st.accent} />
            ))}
          </dl>

          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
            <Link href={`/compare?a=${s.ccn}`}>
              <GlassButton variant="glass" size="md">
                Compare →
              </GlassButton>
            </Link>
            <Link href={`/watch?ccn=${s.ccn}`}>
              <GlassButton variant="primary" size="md">
                Watch for open seats
              </GlassButton>
            </Link>
          </div>
        </GlassCard>

        <div
          style={{
            marginTop: "1.5rem",
            display: "grid",
            gap: "1.25rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          }}
        >
          {meta?.grade_distribution && meta.grade_distribution.length > 0 && (
            <GlassCard elevation={1} radius="lg" padding="1.5rem">
              <GradeHistogram
                distribution={meta.grade_distribution}
                average={meta.grade_average}
                sampleSize={meta.grade_sample_size}
              />
            </GlassCard>
          )}
          <GlassCard elevation={1} radius="lg" padding="1.5rem">
            <WaitlistTrend
              snapshots={snapshots}
              current={{ open_seats: s.open_seats, waitlisted: s.waitlisted, capacity: s.capacity }}
            />
          </GlassCard>
        </div>

        {s.description && (
          <GlassCard elevation={1} radius="lg" padding="1.75rem" style={{ marginTop: "1.5rem" }}>
            <h2 style={{ margin: "0 0 0.85rem", ...display("1.15rem"), color: "var(--glass-text)" }}>Description</h2>
            <p style={{ margin: 0, ...text, color: "var(--glass-text)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {s.description}
            </p>
          </GlassCard>
        )}

        {siblings && siblings.length > 0 && (
          <GlassCard elevation={1} radius="lg" padding="1.5rem" style={{ marginTop: "1.5rem", overflow: "hidden" }}>
            <h2 style={{ margin: "0 0 1rem", ...display("1.15rem"), color: "var(--glass-text)" }}>
              Other sections of {s.course_code}
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-text)", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ color: "var(--glass-text-faint)", textAlign: "left" }}>
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
                    <tr key={sib.ccn} style={{ borderTop: "1px solid var(--glass-border)" }}>
                      <Td>
                        <Link href={`/class/${sib.ccn}`} style={{ color: "var(--glass-text)", textDecoration: "none", ...mono }}>
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
                        <span style={{ color: sib.open_seats > 0 ? "var(--cap-open-text)" : "var(--glass-text-faint)", ...mono }}>
                          {sib.open_seats}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </section>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div
      style={{
        padding: "0.85rem 1rem",
        borderRadius: "var(--r-glass-sm)",
        background: "var(--glass-1)",
        border: "1px solid var(--glass-border)",
      }}
    >
      <dt
        style={{
          fontSize: "0.68rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--glass-text-faint)",
          fontFamily: "var(--font-text)",
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          margin: "0.3rem 0 0",
          color: accent || "var(--glass-text)",
          fontFamily: "var(--font-text)",
          fontWeight: 500,
        }}
      >
        {value === null || value === undefined || value === "" ? "—" : value}
      </dd>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      style={{
        textAlign: right ? "right" : "left",
        padding: "0.5rem 0.85rem",
        fontWeight: 500,
        fontSize: "0.72rem",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
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
        padding: "0.5rem 0.85rem",
        textAlign: right ? "right" : "left",
        color: "var(--glass-text-muted)",
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
