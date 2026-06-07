import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {  GlassCard } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";
import WatchForm from "./watch-form";
import UnsubscribeButton from "./unsubscribe-button";
import type { Section } from "@/lib/types";

export const dynamic = "force-dynamic";

const WRAP: React.CSSProperties = { maxWidth: "780px", margin: "0 auto", padding: "1.75rem 1.5rem 4rem" };
const display = (size: string, weight = 600): React.CSSProperties => ({
  fontFamily: "var(--font-display)",
  fontWeight: weight,
  letterSpacing: "var(--tracking-display)",
  fontSize: size,
});
const text: React.CSSProperties = { fontFamily: "var(--font-text)", color: "var(--glass-text-muted)" };
const mono: React.CSSProperties = { fontFamily: "var(--font-mono-sf)" };

export default async function WatchPage({
  searchParams,
}: {
  searchParams: Promise<{ ccn?: string }>;
}) {
  const { ccn } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/signin?next=${encodeURIComponent(`/watch${ccn ? `?ccn=${ccn}` : ""}`)}`);
  }

  const { data: subsRaw } = await supabase
    .from("watch_subscriptions")
    .select("id, ccn, email_on_open, created_at")
    .order("created_at", { ascending: false });

  const subs = subsRaw ?? [];
  const ccns = subs.map((s) => s.ccn);
  const { data: sectionRows } = ccns.length
    ? await supabase.from("sections").select("*").in("ccn", ccns)
    : { data: [] as Section[] };
  const sectionsByCcn = new Map<number, Section>();
  (sectionRows ?? []).forEach((s) => sectionsByCcn.set(s.ccn, s as Section));

  const preselectCcn = ccn ? parseInt(ccn, 10) : null;

  return (
    <>
      <GlassNav />
      <section style={WRAP}>
        <h1 style={{ margin: 0, ...display("2rem"), color: "var(--glass-text)" }}>Waitlist watcher</h1>
        <p style={{ margin: "0.4rem 0 2rem", ...text }}>
          Get an email when a section opens up or the waitlist shrinks. Powered by hourly snapshots.
        </p>

        <WatchForm initialCcn={preselectCcn ?? undefined} userEmail={user.email ?? ""} />

        <h2 style={{ margin: "2.5rem 0 1rem", ...display("1.25rem"), color: "var(--glass-text)" }}>
          Your watched sections
        </h2>

        {subs.length === 0 ? (
          <p style={{ ...text }}>No active watches yet. Add a CCN above.</p>
        ) : (
          <GlassCard elevation={1} radius="lg" padding={0}>
            {subs.map((sub, i) => {
              const s = sectionsByCcn.get(sub.ccn);
              return (
                <div
                  key={sub.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    padding: "0.85rem 1rem",
                    borderTop: i === 0 ? "none" : "1px solid var(--glass-border)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <Link
                      href={`/class/${sub.ccn}`}
                      style={{ ...mono, fontSize: "0.875rem", color: "var(--glass-text)", textDecoration: "none" }}
                    >
                      {sub.ccn}
                    </Link>{" "}
                    <span style={{ color: "var(--glass-text)", fontFamily: "var(--font-text)" }}>
                      {s ? `${s.course_code} ${s.section_type} ${s.section_number}` : "(not synced)"}
                    </span>
                    <p
                      style={{
                        margin: "0.25rem 0 0",
                        fontSize: "0.75rem",
                        color: "var(--glass-text-faint)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s?.title ?? ""}
                      {s ? ` · ${s.meeting_days ?? ""} ${s.meeting_time ?? ""}` : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                    <span
                      style={{
                        ...mono,
                        fontSize: "0.875rem",
                        color: s && s.open_seats > 0 ? "var(--cap-open-text)" : "var(--glass-text-faint)",
                      }}
                    >
                      {s?.open_seats ?? "—"} open
                    </span>
                    <UnsubscribeButton id={sub.id} />
                  </div>
                </div>
              );
            })}
          </GlassCard>
        )}
      </section>
    </>
  );
}
