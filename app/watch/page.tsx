import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Glass, SeatPill } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";
import WatchForm from "./watch-form";
import UnsubscribeButton from "./unsubscribe-button";
import type { Section } from "@/lib/types";

export const dynamic = "force-dynamic";

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
    <main className="bc-page">
      <GlassNav active="/watch" />

      <Glass className="bc-hero">
        <div className="bc-eyebrow">Waitlist · Notifications</div>
        <h1 className="bc-h1">Watch <span className="bc-h1-accent">waitlists</span>.</h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--muted)" }}>
          Get an email when a section opens up or the waitlist shrinks. Powered by hourly snapshots.
        </p>
      </Glass>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px 60px" }}>
        <WatchForm initialCcn={preselectCcn ?? undefined} userEmail={user.email ?? ""} />

        <h2 style={{ margin: "32px 0 12px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--ink-strong)", letterSpacing: "var(--tracking-display)" }}>
          Your watched sections
        </h2>

        {subs.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>No active watches yet. Add a CCN above.</p>
        ) : (
          <Glass className="bc-watch-list">
            {subs.map((sub, i) => {
              const s = sectionsByCcn.get(sub.ccn);
              return (
                <div
                  key={sub.id}
                  className="bc-row"
                  style={i > 0 ? { borderTop: "0.5px solid var(--hairline)" } : undefined}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Link
                        href={`/class/${sub.ccn}`}
                        style={{ fontFamily: "var(--font-mono-sf)", fontSize: 13, color: "var(--ink-strong)", textDecoration: "none", fontWeight: 600 }}
                      >
                        {sub.ccn}
                      </Link>
                      <span style={{ color: "var(--ink-strong)", fontSize: 13 }}>
                        {s ? `${s.course_code} ${s.section_type} ${s.section_number}` : "(not synced)"}
                      </span>
                    </div>
                    <div className="bc-row-meta">
                      {s?.title ?? ""}
                      {s ? ` · ${s.meeting_days ?? ""} ${s.meeting_time ?? ""}`.trim() : ""}
                    </div>
                  </div>
                  <SeatPill open={s?.open_seats ?? 0} />
                  <UnsubscribeButton id={sub.id} />
                </div>
              );
            })}
          </Glass>
        )}
      </div>
    </main>
  );
}
