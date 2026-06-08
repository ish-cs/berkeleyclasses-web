import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Glass, Button, SeatPill } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";
import ScheduleGrid from "@/components/schedule-grid";
import DeleteScheduleButton from "./delete-schedule-button";
import type { SavedSchedule, Section } from "@/lib/types";

export const dynamic = "force-dynamic";

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
    <main className="bc-page">
      <GlassNav active="/saved" />

      <Glass className="bc-hero">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const }}>
          <div>
            <div className="bc-eyebrow">My schedules</div>
            <h1 className="bc-h1" style={{ marginBottom: 0 }}>Saved.</h1>
          </div>
          <Link href="/schedule" style={{ textDecoration: "none" }}>
            <Button variant="primary">Build new →</Button>
          </Link>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--muted)" }}>
          Signed in as <strong style={{ color: "var(--ink-strong)" }}>{user.email}</strong>
        </p>
      </Glass>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 60px" }}>
        {starredSections.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--ink-strong)", letterSpacing: "var(--tracking-display)" }}>
              Starred classes
            </h2>
            <Glass as="section" className="bc-results">
              {starredSections.map((s) => {
                const courseLine = [s.course_code, s.section_type, s.section_number].filter(Boolean).join(" ");
                return (
                  <article key={s.ccn} className="bc-row">
                    <Link href={`/class/${s.ccn}`}>
                      <div className="bc-row-code">{courseLine}{s.title ? ` — ${s.title}` : ""}</div>
                      <div className="bc-row-meta">{s.instructors ?? "Staff"}</div>
                    </Link>
                    <SeatPill open={s.open_seats ?? 0} />
                  </article>
                );
              })}
            </Glass>
          </div>
        )}

        <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--ink-strong)", letterSpacing: "var(--tracking-display)" }}>
          Schedules
        </h2>

        {schedules.length === 0 ? (
          <Glass style={{ padding: "40px 24px", textAlign: "center" as const }}>
            <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: 14 }}>You haven&apos;t saved any schedules yet.</p>
            <Link href="/schedule" style={{ textDecoration: "none" }}>
              <Button variant="primary">Build one →</Button>
            </Link>
          </Glass>
        ) : (
          <div className="bc-saved-list">
            {schedules.map((sched) => {
              const sections = sched.ccns.map((c) => sectionsByCcn.get(c)).filter(Boolean) as Section[];
              const ccns = sched.ccns.join(",");
              const icsName = sched.name || "schedule";
              return (
                <Glass key={sched.id} style={{ padding: "22px 24px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const, marginBottom: 16 }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="bc-saved-name">{sched.name}</div>
                      <div className="bc-saved-meta">
                        Updated{" "}
                        {new Date(sched.updated_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        · {sched.ccns.length} section{sched.ccns.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={`/api/ics?ccns=${ccns}&name=${encodeURIComponent(icsName)}`} style={{ textDecoration: "none" }}>
                        <Button size="sm">Export .ics</Button>
                      </a>
                      <DeleteScheduleButton id={sched.id} />
                    </div>
                  </div>
                  <ScheduleGrid sections={sections} />
                  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16, fontFamily: "var(--font-text)", fontSize: 13 }}>
                    <tbody>
                      {sched.ccns.map((ccn, i) => {
                        const s = sectionsByCcn.get(ccn);
                        return (
                          <tr key={ccn} style={{ borderTop: i === 0 ? "none" : "0.5px solid var(--hairline)" }}>
                            <td style={{ padding: "6px 12px 6px 0", fontFamily: "var(--font-mono-sf)", color: "var(--muted)", fontSize: 12 }}>
                              <Link href={`/class/${ccn}`} style={{ color: "var(--muted)", textDecoration: "none" }}>
                                {ccn}
                              </Link>
                            </td>
                            <td style={{ padding: "6px 12px", color: "var(--ink-strong)" }}>
                              {s ? `${s.course_code} ${s.section_type} ${s.section_number}` : "(not synced)"}
                            </td>
                            <td style={{ padding: "6px 12px", color: "var(--muted)" }}>{s?.meeting_days ?? "—"}</td>
                            <td style={{ padding: "6px 12px", color: "var(--muted)" }}>{s?.meeting_time ?? "async"}</td>
                            <td style={{ padding: "6px 0", color: "var(--muted)" }}>{s?.instructors ?? ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Glass>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
