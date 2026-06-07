import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {  GlassCard, GlassButton } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";
import ScheduleGrid from "@/components/schedule-grid";
import DeleteScheduleButton from "./delete-schedule-button";
import type { SavedSchedule, Section } from "@/lib/types";

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

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin?next=/saved");

  const { data: schedulesRaw } = await supabase
    .from("saved_schedules")
    .select("id, name, term_id, ccns, notes, created_at, updated_at, user_id")
    .order("updated_at", { ascending: false });

  const schedules = (schedulesRaw ?? []) as SavedSchedule[];

  const { data: starredRows } = await supabase
    .from("starred_sections")
    .select("ccn, created_at")
    .order("created_at", { ascending: false });
  const starredCcns = (starredRows ?? []).map((r) => r.ccn as number);

  const allCcns = Array.from(new Set([...schedules.flatMap((s) => s.ccns), ...starredCcns]));
  const { data: sectionRows } =
    allCcns.length === 0 ? { data: [] as Section[] } : await supabase.from("sections").select("*").in("ccn", allCcns);
  const sectionsByCcn = new Map<number, Section>();
  (sectionRows ?? []).forEach((s) => sectionsByCcn.set(s.ccn, s as Section));
  const starredSections = starredCcns.map((c) => sectionsByCcn.get(c)).filter(Boolean) as Section[];

  return (
    <>
      <GlassNav />
      <section style={WRAP}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            flexWrap: "wrap",
            marginBottom: "0.5rem",
          }}
        >
          <h1 style={{ margin: 0, ...display("2rem"), color: "var(--glass-text)" }}>Saved</h1>
          <Link href="/schedule" style={{ textDecoration: "none" }}>
            <GlassButton variant="primary" size="md">
              Build new →
            </GlassButton>
          </Link>
        </div>
        <p style={{ margin: "0.4rem 0 2rem", ...text }}>
          Signed in as <span style={{ color: "var(--glass-text)" }}>{user.email}</span>
        </p>

        {starredSections.length > 0 && (
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ margin: "0 0 0.85rem", ...display("1.25rem"), color: "var(--glass-text)" }}>
              Starred classes
            </h2>
            <GlassCard elevation={1} radius="lg" padding={0}>
              {starredSections.map((s, i) => (
                <Link
                  key={s.ccn}
                  href={`/class/${s.ccn}`}
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
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-text)", fontWeight: 600 }}>
                      {s.course_code} {s.section_type} {s.section_number}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--glass-text-faint)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s.title}
                    </div>
                  </div>
                  <span
                    style={{
                      ...mono,
                      fontSize: "0.875rem",
                      color: s.open_seats > 0 ? "var(--cap-open-text)" : "var(--glass-text-faint)",
                    }}
                  >
                    {s.open_seats} open
                  </span>
                </Link>
              ))}
            </GlassCard>
          </div>
        )}

        <h2 style={{ margin: "0 0 0.85rem", ...display("1.25rem"), color: "var(--glass-text)" }}>Schedules</h2>
        {schedules.length === 0 ? (
          <GlassCard elevation={1} radius="lg" padding="2rem 1.5rem" specular={false}>
            <p style={{ margin: "0 0 1rem", ...text, textAlign: "center" }}>You haven&apos;t saved any schedules yet.</p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Link href="/schedule" style={{ textDecoration: "none" }}>
                <GlassButton variant="primary" size="md">
                  Build one →
                </GlassButton>
              </Link>
            </div>
          </GlassCard>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {schedules.map((sched) => {
              const sections = sched.ccns.map((c) => sectionsByCcn.get(c)).filter(Boolean) as Section[];
              const ccns = sched.ccns.join(",");
              const icsName = sched.name || "schedule";
              return (
                <GlassCard key={sched.id} elevation={1} radius="lg" padding="1.4rem">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      flexWrap: "wrap",
                      marginBottom: "1rem",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <h3
                        style={{
                          margin: 0,
                          ...display("1.1rem"),
                          color: "var(--glass-text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "40ch",
                        }}
                      >
                        {sched.name}
                      </h3>
                      <p style={{ margin: "0.3rem 0 0", fontSize: "0.75rem", color: "var(--glass-text-faint)", ...text }}>
                        Updated{" "}
                        {new Date(sched.updated_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        · {sched.ccns.length} section{sched.ccns.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <a
                        href={`/api/ics?ccns=${ccns}&name=${encodeURIComponent(icsName)}`}
                        style={{ textDecoration: "none" }}
                      >
                        <GlassButton variant="glass" size="sm">
                          Export .ics
                        </GlassButton>
                      </a>
                      <DeleteScheduleButton id={sched.id} />
                    </div>
                  </div>
                  <ScheduleGrid sections={sections} />
                  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem", fontFamily: "var(--font-text)", fontSize: "0.875rem" }}>
                    <tbody>
                      {sched.ccns.map((ccn, i) => {
                        const s = sectionsByCcn.get(ccn);
                        return (
                          <tr key={ccn} style={{ borderTop: i === 0 ? "none" : "1px solid var(--glass-border)" }}>
                            <td style={{ padding: "0.5rem 0.85rem 0.5rem 0", ...mono, color: "var(--glass-text-faint)" }}>
                              <Link href={`/class/${ccn}`} style={{ color: "var(--glass-text-faint)", textDecoration: "none" }}>
                                {ccn}
                              </Link>
                            </td>
                            <td style={{ padding: "0.5rem 0.85rem", color: "var(--glass-text)" }}>
                              {s ? `${s.course_code} ${s.section_type} ${s.section_number}` : "(not synced)"}
                            </td>
                            <td style={{ padding: "0.5rem 0.85rem", color: "var(--glass-text-muted)" }}>{s?.meeting_days ?? "—"}</td>
                            <td style={{ padding: "0.5rem 0.85rem", color: "var(--glass-text-muted)" }}>{s?.meeting_time ?? "async"}</td>
                            <td style={{ padding: "0.5rem 0", color: "var(--glass-text-faint)" }}>{s?.instructors ?? ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </GlassCard>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
